---
name: frontend-log-bridge
description: Consume browser/frontend runtime errors live via the frontend-log-bridge MCP tool. Use when the user wants to debug a running frontend by reproducing an action in the browser while the agent watches errors arrive in real time — instead of reading log files, tailing DevTools, or copy-pasting stack traces. Triggers include "olhe os erros do frontend", "watch the browser console", "reproduza e me mostre o erro", "capture os errors em tempo real", "debug this action live".
---

# Frontend Log Bridge

Live bridge between a browser app and the agent. The browser POSTs error payloads to a local HTTP endpoint; the agent blocks on the MCP tool `collect_frontend_logs` and receives them as soon as they arrive. **Nothing is written to disk.** The buffer lives in the MCP server process memory.

## When to use

- User asks you to watch for errors while they reproduce a bug in the browser.
- You just changed frontend code and want to catch runtime errors the next interaction produces.
- You want to observe errors from a feature you cannot exercise yourself (auth flow, camera, file upload, etc.) — you wait, the user clicks, you see the error.

Do **not** use for:
- Inspecting historical logs (buffer is in-memory; defaults to 2000 entries and is drained on read).
- Server-side logs — this bridge is for browser/frontend JS only.

## How it works

1. The MCP server boots an HTTP server on `http://127.0.0.1:5858` (override with `FRONTEND_LOG_BRIDGE_PORT`).
2. The frontend POSTs JSON to `/log`. Single objects or arrays of objects are both accepted.
3. Entries are buffered in memory (ring buffer, cap 2000).
4. The agent calls `collect_frontend_logs`; the call blocks up to `timeout_seconds` waiting for entries, then returns and (by default) drains the buffer.

## Available MCP tools

| Tool | Purpose |
|---|---|
| `collect_frontend_logs` | Wait for and return buffered frontend errors. |
| `frontend_log_status` | Report endpoint URL, port, buffered count. |
| `clear_frontend_logs` | Drop everything in the buffer. |

### `collect_frontend_logs` arguments

- `timeout_seconds` (default 20, max 300) — how long to block waiting for new logs when the buffer is empty.
- `min_count` (default 1) — return as soon as N matching logs are available.
- `max_logs` (default 200) — cap on returned entries per call.
- `level` — filter by level string (`error`, `warn`, `info`, `debug`).
- `drain` (default `true`) — remove returned entries from the buffer.
- `since_id` — only return entries with `id` greater than this (useful if `drain: false`).

## Standard debugging flow

1. **Check the bridge is up.** Call `frontend_log_status` once at the start of a debugging session to confirm the endpoint and that the port is bound.
2. **Tell the user exactly what to do.** Example: "Agora reproduza o clique no botão de checkout. Vou esperar até 30s pelos erros."
3. **Call `collect_frontend_logs`** with a timeout that matches how long the reproduction will take. For slow manual flows use `timeout_seconds: 60–120` and `min_count: 1` so you return the moment the first error arrives.
4. **Inspect the returned entries** — look at `message`, `stack`, `url`, `extra`. The frontend code should ideally include the file/component in `extra`.
5. **If the user is still clicking**, call `collect_frontend_logs` again. With default `drain: true` each call returns only the new entries since the last call.
6. **When done**, `clear_frontend_logs` if you want a clean slate for the next session. Otherwise the buffer stays small and is drained naturally.

## Wiring the frontend (one-time per project)

The bridge does nothing until the frontend actually posts to it. Add a tiny reporter. Minimal version:

```ts
// src/lib/log-bridge.ts
const ENDPOINT = 'http://127.0.0.1:5858/log'

async function send(payload: Record<string, unknown>) {
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userAgent: navigator.userAgent, url: location.href }),
      keepalive: true,
    })
  } catch {
    // bridge offline — ignore silently
  }
}

if (import.meta.env.DEV) {
  window.addEventListener('error', (e) => {
    send({ level: 'error', message: e.message, stack: e.error?.stack, extra: { filename: e.filename, line: e.lineno, col: e.colno } })
  })
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason
    send({ level: 'error', message: String(reason?.message ?? reason), stack: reason?.stack, extra: { kind: 'unhandledrejection' } })
  })

  const origError = console.error
  console.error = (...args) => {
    send({ level: 'error', message: args.map(String).join(' '), extra: { kind: 'console.error' } })
    origError(...args)
  }
}
```

Import it once from the app entrypoint (`main.ts`, `main.tsx`, `app.vue`, etc.). Gate on `import.meta.env.DEV` / `process.env.NODE_ENV === 'development'` so the bridge never runs in production.

**Framework hooks worth adding**:
- Vue: `app.config.errorHandler = (err, _, info) => send({ level: 'error', message: err.message, stack: err.stack, extra: { info } })`
- React: wrap the root in an ErrorBoundary whose `componentDidCatch` calls `send(...)`.
- React Router / Vue Router: log navigation errors from the router's error hook.

## Payload schema

The bridge accepts any JSON object; known fields are normalized. Prefer this shape:

```json
{
  "level": "error",
  "message": "Cannot read properties of undefined (reading 'id')",
  "stack": "TypeError: ...\n    at Checkout.tsx:42:18",
  "url": "http://localhost:5173/checkout",
  "userAgent": "Mozilla/5.0 ...",
  "extra": { "component": "Checkout", "action": "submit" }
}
```

Arrays are also accepted: `POST /log` with `[{...}, {...}]` stores all entries at once.

## Quick sanity test

Without touching the frontend, verify the bridge round-trips from the terminal:

```bash
curl -s http://127.0.0.1:5858/health
curl -s -X POST http://127.0.0.1:5858/log \
  -H 'content-type: application/json' \
  -d '{"level":"error","message":"test from curl","stack":"at test"}'
```

Then call `collect_frontend_logs` — the entry should come back. Call `clear_frontend_logs` to reset.

## Troubleshooting

- **`ECONNREFUSED` from the browser** → the MCP server isn't running. Restart Claude Code so the plugin's MCP server boots, or check `frontend_log_status`.
- **Port in use** → set `FRONTEND_LOG_BRIDGE_PORT` in the plugin config and in the frontend's endpoint constant. Both must match.
- **CORS error in browser** → the bridge already sends `Access-Control-Allow-Origin: *`. If blocked anyway, confirm the request is hitting `127.0.0.1` (not `localhost`) consistently; some browsers treat them as different origins for mixed-content rules.
- **`collect_frontend_logs` returns 0 after timeout** → reporter not wired, or the user hasn't triggered the error yet, or an earlier call already drained it. Run the curl sanity test above to isolate which side is broken.

## Etiquette

- Tell the user when you're about to block on `collect_frontend_logs` and for how long, so they know to act.
- Use `timeout_seconds` generously for manual reproduction (30–120s) and tightly (2–5s) when you already triggered the action yourself.
- Prefer `drain: true` (the default) — treating each call as "new logs since last call" is the simpler mental model.
