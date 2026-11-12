import { timingSafeEqual } from 'node:crypto'

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'Authorization, Content-Type, Accept',
  'access-control-max-age': '86400',
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}

export function empty(status: number): Response {
  return new Response(null, { status, headers: CORS_HEADERS })
}

export function authorize(request: Request): void {
  const expected = process.env.API_TOKEN?.trim()
  if (!expected) throw new HttpError(500, 'API_TOKEN is not set.')

  const header = request.headers.get('authorization') ?? ''
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header)
  const provided = match?.[1] ?? ''
  if (!safeEqual(provided, expected)) {
    throw new HttpError(401, 'Missing or rejected token.')
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new HttpError(409, 'Invalid JSON.')
  }
}

export function routePath(request: Request): string[] {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, '') || '/'
  const relative = pathname.replace(/^\/api(?=\/|$)/, '') || '/'
  return relative.split('/').filter(Boolean).map(decodeSegment)
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    throw new HttpError(409, 'Invalid path.')
  }
}

function safeEqual(provided: string, expected: string): boolean {
  const left = Buffer.from(provided)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}
