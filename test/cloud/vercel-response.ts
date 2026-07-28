import type { VercelRequest, VercelResponse } from '@vercel/node'

export type CapturedResponse = {
  statusCode: number
  body: unknown
  ended: boolean
  headers: Map<string, string | string[] | number>
}

export function createResponse(): {
  res: VercelResponse
  captured: CapturedResponse
} {
  const captured: CapturedResponse = {
    statusCode: 200,
    body: undefined,
    ended: false,
    headers: new Map(),
  }

  const response = {
    setHeader(name: string, value: string | string[] | number) {
      captured.headers.set(name.toLowerCase(), value)
      return response
    },
    getHeader(name: string) {
      return captured.headers.get(name.toLowerCase())
    },
    status(code: number) {
      captured.statusCode = code
      return response
    },
    json(body: unknown) {
      captured.body = body
      return response
    },
    send(body: unknown) {
      captured.body = body
      return response
    },
    end() {
      captured.ended = true
      return response
    },
  }

  return {
    res: response as unknown as VercelResponse,
    captured,
  }
}

export function createRequest(
  overrides: Partial<VercelRequest> = {},
): VercelRequest {
  return {
    method: 'GET',
    query: {},
    headers: {},
    body: undefined,
    cookies: {},
    ...overrides,
  } as VercelRequest
}
