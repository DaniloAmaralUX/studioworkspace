declare module '@vercel/node' {
  import type {
    IncomingMessage,
    ServerResponse,
  } from 'node:http'

  export interface VercelRequest extends IncomingMessage {
    body: unknown
    cookies: Record<string, string>
    query: Record<string, string | string[]>
  }

  export interface VercelResponse extends ServerResponse {
    status(statusCode: number): VercelResponse
    json(jsonBody: unknown): VercelResponse
    send(body: unknown): VercelResponse
    redirect(statusOrUrl: number | string, url?: string): VercelResponse
  }
}
