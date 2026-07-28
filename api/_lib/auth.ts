import type { VercelRequest } from '@vercel/node'

/**
 * A integração cloud usa somente o PAT fine-grained read-only mantido na
 * variável de ambiente da Vercel. O request é aceito para manter o contrato
 * dos handlers existentes, mas nunca é inspecionado em busca de credenciais.
 */
export function resolveGithubToken(
  _req?: VercelRequest,
): string | null {
  return process.env.GITHUB_TOKEN?.trim() || null
}

export function authVia(
  _req?: VercelRequest,
): 'pat' | null {
  return resolveGithubToken() ? 'pat' : null
}
