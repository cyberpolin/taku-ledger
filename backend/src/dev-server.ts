import { existsSync, readFileSync } from 'node:fs'
import { createServer, type IncomingMessage } from 'node:http'
import { handle } from './handle'

loadEnvFile()

const port = Number(process.env.PORT ?? 3000)
const host = '127.0.0.1'

const server = createServer(async (req, res) => {
  try {
    const response = await handle(await toRequest(req))
    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    const bytes = Buffer.from(await response.arrayBuffer())
    res.end(bytes)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed.'
    res.statusCode = 500
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ error: message }))
  }
})

server.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`)
})

function loadEnvFile(): void {
  if (!existsSync('.env')) return
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] == null) process.env[key] = value
  }
}

async function toRequest(req: IncomingMessage): Promise<Request> {
  const url = `http://${req.headers.host ?? `${host}:${port}`}${req.url ?? '/'}`
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const body = Buffer.concat(chunks)
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null || key === 'content-length') continue
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item)
    } else {
      headers.set(key, value)
    }
  }
  const method = req.method ?? 'GET'
  return new Request(url, {
    method,
    headers,
    body: body.length > 0 && method !== 'GET' && method !== 'HEAD' ? body : undefined,
  })
}
