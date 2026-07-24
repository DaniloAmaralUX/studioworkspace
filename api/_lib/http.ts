// Helpers de resposta no mesmo formato de erro do backend desktop
// ({ error: { code, message } }), que o frontend já sabe ler.
import type { VercelResponse } from '@vercel/node'

export function sendError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({ error: { code, message } })
}

export function methodNotAllowed(res: VercelResponse, allow: string): void {
  res.setHeader('Allow', allow)
  sendError(res, 405, 'method_not_allowed', `Use ${allow}.`)
}

export function internalError(res: VercelResponse, err: unknown): void {
  const message = err instanceof Error ? err.message : 'Erro interno.'
  sendError(res, 500, 'internal_error', message)
}
