// Encerra a sessão OAuth: limpa o cookie. POST responde JSON (chamada do app);
// GET redireciona pra Home (para um link direto). O PAT de env, se houver,
// continua valendo como fallback — logout só derruba a sessão do usuário.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { methodNotAllowed } from '../_lib/http.js'
import { baseUrl, clearSessionCookie } from '../_lib/auth.js'

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return methodNotAllowed(res, 'POST, GET')
  }
  clearSessionCookie(res)
  if (req.method === 'GET') {
    res.setHeader('Location', `${baseUrl(req)}/`)
    res.status(302).end()
    return
  }
  res.status(200).json({ ok: true })
}
