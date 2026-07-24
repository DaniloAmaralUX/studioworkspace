// Rotas de GitHub num só handler (status | repos) para caber no limite de 12
// Serverless Functions do Hobby. URLs iguais: /api/github/status · /api/github/repos
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { internalError, methodNotAllowed, sendError } from '../_lib/http.js'
import { repoList, viewer, GithubError } from '../_lib/github.js'
import { authVia, oauthConfigured, resolveGithubToken } from '../_lib/auth.js'

// GET /api/github/status — como o request está autenticado (OAuth ou PAT), login,
// e se o OAuth está disponível (pro frontend mostrar "Entrar").
async function status(req: VercelRequest, res: VercelResponse): Promise<void> {
  const oauthAvailable = oauthConfigured()
  const via = authVia(req)
  const token = resolveGithubToken(req)
  if (!token) {
    res.status(200).json({ authed: false, via: null, oauthAvailable })
    return
  }
  try {
    const { login } = await viewer(token)
    res.status(200).json({ authed: true, via, login, oauthAvailable })
  } catch (err) {
    const message =
      err instanceof GithubError ? err.message : 'Falha ao validar a credencial.'
    res.status(200).json({ authed: false, via, oauthAvailable, error: message })
  }
}

// GET /api/github/repos — lista os repos do dono da credencial (alimenta o "+ Projeto").
async function repos(req: VercelRequest, res: VercelResponse): Promise<void> {
  const token = resolveGithubToken(req)
  if (!token) {
    return sendError(res, 503, 'github_error', 'Sem credencial: entre com GitHub.')
  }
  try {
    res.status(200).json(await repoList(token))
  } catch (err) {
    if (err instanceof GithubError) {
      return sendError(res, err.status === 503 ? 503 : 502, 'github_error', err.message)
    }
    internalError(res, err)
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET')
  const resource = req.query.resource
  if (resource === 'status') return status(req, res)
  if (resource === 'repos') return repos(req, res)
  return sendError(res, 404, 'not_found', 'Recurso GitHub desconhecido.')
}
