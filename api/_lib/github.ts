// Cliente GitHub da variante cloud (substitui o `gh` CLI do desktop).
// Credencial passada por parâmetro (token): vem da sessão OAuth (cookie) ou,
// como fallback, do PAT GITHUB_TOKEN em env var — resolvido em _lib/auth.ts.
// Nunca em código, log ou KV (PLANO2.md, emenda de charter).
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

async function gh<T>(path: string, token: string): Promise<T> {
  if (!token) {
    throw new GithubError(
      503,
      'Sem credencial do GitHub: entre com GitHub ou cadastre o PAT nas env vars.',
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
export async function viewer(token: string): Promise<{ login: string }> {
  return gh<{ login: string }>('/user', token)
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
export async function repoList(token: string, limit = 100): Promise<GithubRepo[]> {
  const raw = await gh<RawRepo[]>(
    `/user/repos?sort=pushed&direction=desc&per_page=${Math.min(limit, 100)}`,
    token,
  )
  return raw.map(normalize)
}

/** Metadados de um repo (espelha `gh repo view`). */
export async function repoView(
  token: string,
  nameWithOwner: string,
): Promise<GithubRepo> {
  return normalize(await gh<RawRepo>(`/repos/${nameWithOwner}`, token))
}

/** Assuntos dos commits recentes (mais novo primeiro). Best-effort: [] se falhar. */
export async function repoCommits(
  token: string,
  nameWithOwner: string,
  limit = 12,
): Promise<string[]> {
  try {
    const raw = await gh<{ commit: { message: string } }[]>(
      `/repos/${nameWithOwner}/commits?per_page=${Math.min(limit, 50)}`,
      token,
    )
    return raw
      .map((c) => c.commit.message.split('\n')[0]?.trim() ?? '')
      .filter(Boolean)
  } catch {
    return []
  }
}

/** Trecho do README (raw). Best-effort: null se não existir/falhar. */
export async function repoReadme(
  token: string,
  nameWithOwner: string,
  maxChars = 2000,
): Promise<string | null> {
  if (!token) return null
  try {
    const res = await fetch(`${API}/repos/${nameWithOwner}/readme`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.raw+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'project-studio-cloud',
      },
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.trim() ? text.slice(0, maxChars) : null
  } catch {
    return null
  }
}
