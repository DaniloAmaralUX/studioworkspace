// Rotas de GitHub num só handler (status | repos) para caber no limite de 12
// Serverless Functions do Hobby. URLs iguais: /api/github/status · /api/github/repos
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  internalError,
  methodNotAllowed,
  noStore,
  sendError,
} from '../_lib/http.js'
import { repoList, viewer, GithubError } from '../_lib/github.js'
import { authVia, resolveGithubToken } from '../_lib/auth.js'

function publicGithubError(error: GithubError): {
  status: number
  code: string
  message: string
} {
  switch (error.code) {
    case 'github_not_configured':
      return {
        status: 503,
        code: error.code,
        message: 'GitHub não está configurado no servidor.',
      }
    case 'github_auth_failed':
      return {
        status: 502,
        code: error.code,
        message: 'Não foi possível autenticar a conexão do GitHub.',
      }
    case 'github_rate_limited':
      return {
        status: 429,
        code: error.code,
        message: 'O limite de consultas do GitHub foi atingido.',
      }
    case 'github_timeout':
      return {
        status: 504,
        code: error.code,
        message: 'O GitHub não respondeu a tempo.',
      }
    default:
      return {
        status: 502,
        code: 'github_failed',
        message: 'Não foi possível consultar o GitHub agora.',
      }
  }
}

// GET /api/github/status — valida somente o PAT mantido no servidor.
async function status(req: VercelRequest, res: VercelResponse): Promise<void> {
  const via = authVia(req)
  const token = resolveGithubToken(req)
  if (!token) {
    res.status(200).json({ authed: false, via: null })
    return
  }
  try {
    const { login } = await viewer(token)
    res.status(200).json({ authed: true, via, login })
  } catch {
    res.status(200).json({
      authed: false,
      via,
      error: 'Não foi possível validar a conexão com o GitHub.',
    })
  }
}

// GET /api/github/repos — lista os repos do dono da credencial (alimenta o "+ Projeto").
async function repos(req: VercelRequest, res: VercelResponse): Promise<void> {
  const token = resolveGithubToken(req)
  if (!token) {
    return sendError(
      res,
      503,
      'github_not_configured',
      'GitHub não está configurado no servidor.',
    )
  }
  try {
    res.status(200).json(await repoList(token))
  } catch (err) {
    if (err instanceof GithubError) {
      const safe = publicGithubError(err)
      return sendError(res, safe.status, safe.code, safe.message)
    }
    internalError(res, err)
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  noStore(res)
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET')
  const resource = req.query.resource
  if (resource === 'status') return status(req, res)
  if (resource === 'repos') return repos(req, res)
  return sendError(res, 404, 'not_found', 'Recurso GitHub desconhecido.')
}
