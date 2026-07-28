// Helpers de resposta no mesmo formato de erro do backend desktop
// ({ error: { code, message } }), que o frontend já sabe ler.
import type { VercelResponse } from '@vercel/node'

export const NO_STORE_VALUE = 'private, no-store, max-age=0'

export function noStore(res: VercelResponse): void {
  res.setHeader('Cache-Control', NO_STORE_VALUE)
  res.setHeader('CDN-Cache-Control', 'no-store')
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store')
}

export function sendError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
): void {
  noStore(res)
  res.status(status).json({ error: { code, message } })
}

export function methodNotAllowed(res: VercelResponse, allow: string): void {
  res.setHeader('Allow', allow)
  sendError(res, 405, 'method_not_allowed', `Use ${allow}.`)
}

export function internalError(
  res: VercelResponse,
  _err?: unknown,
): void {
  sendError(
    res,
    500,
    'internal_error',
    'Não foi possível concluir a operação agora.',
  )
}
