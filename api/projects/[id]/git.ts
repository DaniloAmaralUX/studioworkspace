// Na nuvem não existe working tree local. Responder o shape que o frontend já
// trata (isRepo:false) evita erro na tela de detalhe; "repo insights" via
// Octokit chegam na Fatia 2.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { methodNotAllowed } from '../../_lib/http.js'

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET')
  res.status(200).json({ isRepo: false, reason: 'cloud' })
}
