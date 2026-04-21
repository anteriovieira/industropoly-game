#!/usr/bin/env node
// Frontend Log Bridge - MCP stdio server + embedded HTTP log sink.
// Protocol: newline-delimited JSON-RPC 2.0 on stdio (MCP).
// HTTP: localhost:PORT accepts POST /log for browser-side errors.

import http from 'node:http'
import readline from 'node:readline'

const PORT = Number(process.env.FRONTEND_LOG_BRIDGE_PORT || 5858)
const HOST = process.env.FRONTEND_LOG_BRIDGE_HOST || '127.0.0.1'
const BUFFER_MAX = 2000

const logs = []           // ring buffer of received entries
let seq = 0               // monotonic id for each log
const waiters = []        // pending tool calls awaiting new logs

function now() {
  return new Date().toISOString()
}

function pushLog(entry, meta) {
  const normalized = {
    id: ++seq,
    received_at: now(),
    source_ip: meta.ip,
    level: entry.level || 'error',
    message: entry.message ?? '',
    stack: entry.stack ?? null,
    url: entry.url ?? null,
    user_agent: entry.userAgent ?? meta.ua ?? null,
    extra: entry.extra ?? entry.context ?? null,
    raw: entry,
  }
  logs.push(normalized)
  if (logs.length > BUFFER_MAX) logs.shift()
  // Wake every waiter; they'll re-check conditions.
  for (const w of waiters.splice(0)) w()
  return normalized
}

// ---------- HTTP sink ----------

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Source')
  res.setHeader('Access-Control-Max-Age', '86400')
}

function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const httpServer = http.createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      ok: true,
      service: 'frontend-log-bridge',
      port: PORT,
      buffered: logs.length,
      endpoint: `http://${HOST}:${PORT}/log`,
    }))
    return
  }

  if (req.method === 'POST' && (req.url === '/log' || req.url === '/logs')) {
    try {
      const body = await readBody(req)
      const parsed = body ? JSON.parse(body) : {}
      const meta = {
        ip: req.socket.remoteAddress,
        ua: req.headers['user-agent'],
      }
      const items = Array.isArray(parsed) ? parsed : [parsed]
      const stored = items.map((it) => pushLog(it, meta))
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, stored: stored.length, ids: stored.map((s) => s.id) }))
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: String(err.message || err) }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: false, error: 'not found' }))
})

httpServer.on('error', (err) => {
  // Report fatal HTTP bind failures to stderr so Claude surfaces them.
  process.stderr.write(`[frontend-log-bridge] HTTP error: ${err.message}\n`)
})

httpServer.listen(PORT, HOST, () => {
  process.stderr.write(`[frontend-log-bridge] listening on http://${HOST}:${PORT}/log\n`)
})

// ---------- MCP stdio ----------

const TOOLS = [
  {
    name: 'collect_frontend_logs',
    description:
      'Aguarda e retorna logs de erro enviados pelo frontend via HTTP POST em http://localhost:' +
      PORT +
      '/log. Bloqueia por até `timeout_seconds` esperando novos logs; retorna imediatamente se já houver entradas no buffer. Por padrão drena o buffer após a leitura. Use para debugar em tempo real: chame a tool, reproduza o erro no navegador e observe os logs retornarem.',
    inputSchema: {
      type: 'object',
      properties: {
        timeout_seconds: {
          type: 'number',
          description: 'Tempo máximo de espera por novos logs quando o buffer está vazio. Padrão 20s.',
          default: 20,
          minimum: 0,
          maximum: 300,
        },
        min_count: {
          type: 'integer',
          description: 'Retorna assim que pelo menos N logs estiverem disponíveis. Padrão 1.',
          default: 1,
          minimum: 1,
        },
        max_logs: {
          type: 'integer',
          description: 'Máximo de logs a retornar numa única chamada. Padrão 200.',
          default: 200,
          minimum: 1,
        },
        level: {
          type: 'string',
          description: 'Filtra por nível (error, warn, info, debug). Omita para receber todos.',
        },
        drain: {
          type: 'boolean',
          description: 'Se true (padrão), remove do buffer os logs retornados.',
          default: true,
        },
        since_id: {
          type: 'integer',
          description: 'Retorna apenas logs com id maior que este. Útil para chamadas sequenciais sem drain.',
        },
      },
    },
  },
  {
    name: 'frontend_log_status',
    description: 'Retorna o status do bridge (porta, endpoint HTTP, quantidade de logs bufferizados).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'clear_frontend_logs',
    description: 'Descarta todos os logs atualmente bufferizados.',
    inputSchema: { type: 'object', properties: {} },
  },
]

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n')
}

function okResult(id, text, structured) {
  const content = [{ type: 'text', text }]
  const result = { content }
  if (structured) result.structuredContent = structured
  send({ jsonrpc: '2.0', id, result })
}

function errorResult(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } })
}

function matches(entry, args) {
  if (args.level && entry.level !== args.level) return false
  if (args.since_id && entry.id <= args.since_id) return false
  return true
}

async function callCollect(args = {}) {
  const timeoutMs = Math.max(0, Number(args.timeout_seconds ?? 20) * 1000)
  const minCount = Math.max(1, Number(args.min_count ?? 1))
  const maxLogs = Math.max(1, Number(args.max_logs ?? 200))
  const drain = args.drain !== false
  const deadline = Date.now() + timeoutMs

  while (true) {
    const matched = logs.filter((l) => matches(l, args))
    if (matched.length >= minCount || Date.now() >= deadline) {
      const slice = matched.slice(0, maxLogs)
      if (drain && slice.length) {
        const ids = new Set(slice.map((s) => s.id))
        for (let i = logs.length - 1; i >= 0; i--) {
          if (ids.has(logs[i].id)) logs.splice(i, 1)
        }
      }
      return {
        count: slice.length,
        endpoint: `http://${HOST}:${PORT}/log`,
        buffered_remaining: logs.length,
        logs: slice,
      }
    }
    await new Promise((resolve) => {
      const remaining = deadline - Date.now()
      const to = setTimeout(resolve, Math.max(10, remaining))
      waiters.push(() => {
        clearTimeout(to)
        resolve()
      })
    })
  }
}

function statusPayload() {
  return {
    service: 'frontend-log-bridge',
    endpoint: `http://${HOST}:${PORT}/log`,
    port: PORT,
    buffered: logs.length,
    last_id: seq,
  }
}

async function handle(msg) {
  if (msg.method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'frontend-log-bridge', version: '0.1.0' },
      },
    })
    return
  }

  if (msg.method === 'notifications/initialized' || msg.method === 'notifications/cancelled') {
    return // no response for notifications
  }

  if (msg.method === 'tools/list') {
    send({ jsonrpc: '2.0', id: msg.id, result: { tools: TOOLS } })
    return
  }

  if (msg.method === 'tools/call') {
    const name = msg.params?.name
    const args = msg.params?.arguments ?? {}
    try {
      if (name === 'collect_frontend_logs') {
        const data = await callCollect(args)
        const text =
          data.count === 0
            ? `Nenhum log recebido em ${args.timeout_seconds ?? 20}s. Endpoint: ${data.endpoint}`
            : `${data.count} log(s) recebido(s) em ${data.endpoint}\n\n` + JSON.stringify(data, null, 2)
        return okResult(msg.id, text, data)
      }
      if (name === 'frontend_log_status') {
        const s = statusPayload()
        return okResult(msg.id, JSON.stringify(s, null, 2), s)
      }
      if (name === 'clear_frontend_logs') {
        const removed = logs.length
        logs.splice(0, logs.length)
        const payload = { cleared: removed, buffered: 0 }
        return okResult(msg.id, `Buffer limpo. Removidos: ${removed}.`, payload)
      }
      return errorResult(msg.id, -32601, `Unknown tool: ${name}`)
    } catch (err) {
      return errorResult(msg.id, -32000, String(err?.message || err))
    }
  }

  if (msg.id !== undefined) {
    errorResult(msg.id, -32601, `Method not found: ${msg.method}`)
  }
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })
rl.on('line', (line) => {
  if (!line.trim()) return
  let msg
  try {
    msg = JSON.parse(line)
  } catch {
    return
  }
  Promise.resolve(handle(msg)).catch((err) => {
    if (msg?.id !== undefined) errorResult(msg.id, -32000, String(err?.message || err))
  })
})

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))
