// Dev-only bridge that forwards runtime errors to a local MCP server, so the
// agent can watch them live while the user reproduces on another device.
//
// Because the app is served over `vite --host` and opened from a tablet on the
// LAN, we can't use `127.0.0.1` — that's the tablet's own loopback. Use the
// current origin's hostname (the dev machine's LAN IP) and let the MCP bridge
// bind to `0.0.0.0:5858` so both the laptop and the tablet hit the same
// endpoint. Override with `VITE_LOG_BRIDGE_ENDPOINT` if needed.

const EXPLICIT_ENDPOINT = import.meta.env.VITE_LOG_BRIDGE_ENDPOINT as string | undefined;
const DEFAULT_PORT = 5858;

function resolveEndpoint(): string {
  if (EXPLICIT_ENDPOINT) return EXPLICIT_ENDPOINT;
  if (typeof window === 'undefined') return `http://127.0.0.1:${DEFAULT_PORT}/log`;
  return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_PORT}/log`;
}

let installed = false;

export function installLogBridge(): void {
  if (!import.meta.env.DEV || installed) return;
  installed = true;

  const endpoint = resolveEndpoint();
  // eslint-disable-next-line no-console
  console.info('[logBridge] posting runtime errors to', endpoint);

  function send(payload: Record<string, unknown>): void {
    const body = JSON.stringify({
      ...payload,
      userAgent: navigator.userAgent,
      url: location.href,
    });
    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        /* bridge offline — ignore silently */
      });
    } catch {
      /* bridge offline — ignore silently */
    }
  }

  window.addEventListener('error', (e) => {
    send({
      level: 'error',
      message: e.message,
      stack: e.error?.stack,
      extra: { kind: 'window.error', filename: e.filename, line: e.lineno, col: e.colno },
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason as { message?: string; stack?: string } | string | undefined;
    send({
      level: 'error',
      message: typeof reason === 'string' ? reason : String(reason?.message ?? reason),
      stack: typeof reason === 'string' ? undefined : reason?.stack,
      extra: { kind: 'unhandledrejection' },
    });
  });

  const origError = console.error;
  console.error = (...args: unknown[]) => {
    try {
      send({
        level: 'error',
        message: args.map((a) => (a instanceof Error ? (a.stack ?? a.message) : String(a))).join(' '),
        extra: { kind: 'console.error' },
      });
    } catch {
      /* ignore */
    }
    origError(...args);
  };

  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    try {
      send({
        level: 'warn',
        message: args.map(String).join(' '),
        extra: { kind: 'console.warn' },
      });
    } catch {
      /* ignore */
    }
    origWarn(...args);
  };
}

export function reportToLogBridge(
  level: 'error' | 'warn' | 'info',
  message: string,
  extra?: Record<string, unknown>,
  stack?: string,
): void {
  if (!import.meta.env.DEV) return;
  const endpoint = resolveEndpoint();
  try {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        stack,
        extra,
        userAgent: navigator.userAgent,
        url: location.href,
      }),
      keepalive: true,
    }).catch(() => {
      /* ignore */
    });
  } catch {
    /* ignore */
  }
}
