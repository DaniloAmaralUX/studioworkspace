// Cliente GitHub da variante cloud (substitui o `gh` CLI do desktop).
// Credencial: GITHUB_TOKEN (PAT fine-grained read-only) em env var da Vercel —
// nunca em código, log ou KV (PLANO2.md, emenda de charter).
// fetch nativo do Node 24; sem dependência de Octokit para manter as funções leves.

const API = 'https://api.github.com'

export function tokenPresent(): boolean {
  return Boolean(process.env.GITHUB_TOKEN)
}

export class GithubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function gh<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new GithubError(
      503,
      'GITHUB_TOKEN não configurado: cadastre o PAT nas env vars do projeto.',
    )
  }
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'project-studio-cloud',
    },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string
    } | null
    throw new GithubError(
      res.status,
      body?.message ?? `GitHub respondeu HTTP ${res.status}.`,
    )
  }
  return (await res.json()) as T
}

/** Quem é o dono do token (valida autenticação). */
export async function viewer(): Promise<{ login: string }> {
  return gh<{ login: string }>('/user')
}

export type GithubRepo = {
  nameWithOwner: string
  description: string | null
  primaryLanguage: string | null
  pushedAt: string | null
  url: string
}

type RawRepo = {
  full_name: string
  description: string | null
  language: string | null
  pushed_at: string | null
  html_url: string
}

function normalize(r: RawRepo): GithubRepo {
  return {
    nameWithOwner: r.full_name,
    description: r.description,
    primaryLanguage: r.language,
    pushedAt: r.pushed_at,
    url: r.html_url,
  }
}

/** Repos do dono do token, mais recentes primeiro (espelha `gh repo list`). */
export async function repoList(limit = 100): Promise<GithubRepo[]> {
  const raw = await gh<RawRepo[]>(
    `/user/repos?sort=pushed&direction=desc&per_page=${Math.min(limit, 100)}`,
  )
  return raw.map(normalize)
}

/** Metadados de um repo (espelha `gh repo view`). */
export async function repoView(nameWithOwner: string): Promise<GithubRepo> {
  return normalize(await gh<RawRepo>(`/repos/${nameWithOwner}`))
}
