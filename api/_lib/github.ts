// Cliente GitHub da variante cloud. A única credencial aceita é o PAT
// fine-grained read-only em GITHUB_TOKEN (Vercel env). O token nunca entra em
// cookie, KV, resposta, prompt ou log.

const API = 'https://api.github.com'
const REQUEST_TIMEOUT_MS = 10_000

export type GithubErrorCode =
  | 'github_not_configured'
  | 'github_auth_failed'
  | 'github_rate_limited'
  | 'github_not_found'
  | 'github_timeout'
  | 'github_failed'

export class GithubError extends Error {
  constructor(
    public status: number,
    public code: GithubErrorCode,
    message: string,
  ) {
    super(message)
  }
}

export type GithubRepo = {
  nameWithOwner: string
  description: string | null
  primaryLanguage: string | null
  pushedAt: string | null
  url: string
  defaultBranch: string
}

export type GithubCommit = {
  sha: string
  title: string
  url: string
  committedAt: string | null
}

export type GithubReadme = {
  text: string
  path: string
  url: string
}

export type GithubIssue = {
  number: number
  title: string
  url: string
  updatedAt: string | null
}

export type GithubPullRequest = {
  number: number
  title: string
  draft: boolean
  url: string
  updatedAt: string | null
}

export type GithubWorkflowRun = {
  id: number
  name: string
  status: string | null
  conclusion: string | null
  headBranch: string | null
  url: string
  startedAt: string | null
}

export type GithubContextSnapshot = {
  repository: GithubRepo
  readme: GithubReadme | null
  commits: GithubCommit[]
  issues: GithubIssue[]
  pullRequests: GithubPullRequest[]
  ciRuns: GithubWorkflowRun[]
  fetchedAt: string
  partial: boolean
  warnings: string[]
}

type RawRepo = {
  full_name: string
  description: string | null
  language: string | null
  pushed_at: string | null
  html_url: string
  default_branch: string
}

type RawCommit = {
  sha: string
  html_url: string
  commit: {
    message: string
    author: { date: string | null } | null
    committer: { date: string | null } | null
  }
}

type RawReadme = {
  content: string
  encoding: string
  path: string
  html_url: string
}

type RawIssue = {
  number: number
  title: string
  html_url: string
  updated_at: string | null
  /** Presente só quando o item é, na verdade, um pull request. */
  pull_request?: unknown
}

type RawPull = {
  number: number
  title: string
  html_url: string
  updated_at: string | null
  draft?: boolean
}

type RawWorkflowRuns = {
  workflow_runs?: {
    id: number
    name: string | null
    status: string | null
    conclusion: string | null
    head_branch: string | null
    html_url: string
    run_started_at?: string | null
    updated_at?: string | null
  }[]
}

export function tokenPresent(): boolean {
  return Boolean(process.env.GITHUB_TOKEN?.trim())
}

function repositoryPath(nameWithOwner: string): string {
  const [owner, repo, ...rest] = nameWithOwner.split('/')
  if (!owner || !repo || rest.length > 0) {
    throw new GithubError(
      400,
      'github_failed',
      'Identificador de repositório inválido.',
    )
  }
  return `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
}

function errorFromResponse(res: Response): GithubError {
  if (res.status === 401) {
    return new GithubError(
      401,
      'github_auth_failed',
      'A credencial de leitura do GitHub foi recusada.',
    )
  }
  const rateRemaining = res.headers.get('x-ratelimit-remaining')
  if (res.status === 429 || (res.status === 403 && rateRemaining === '0')) {
    return new GithubError(
      429,
      'github_rate_limited',
      'O limite de consultas do GitHub foi atingido. Tente novamente mais tarde.',
    )
  }
  if (res.status === 404) {
    return new GithubError(
      404,
      'github_not_found',
      'Repositório não encontrado ou sem acesso.',
    )
  }
  return new GithubError(
    res.status,
    'github_failed',
    `O GitHub respondeu com HTTP ${res.status}.`,
  )
}

async function request(
  path: string,
  token: string,
  accept = 'application/vnd.github+json',
): Promise<Response> {
  const normalizedToken = token.trim()
  if (!normalizedToken) {
    throw new GithubError(
      503,
      'github_not_configured',
      'Configure o GITHUB_TOKEN read-only na Vercel.',
    )
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(`${API}${path}`, {
      headers: {
        Authorization: `Bearer ${normalizedToken}`,
        Accept: accept,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'project-studio-cloud',
      },
      signal: controller.signal,
    })
    if (!res.ok) throw errorFromResponse(res)
    return res
  } catch (error) {
    if (
      (error instanceof DOMException && error.name === 'AbortError') ||
      (typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'AbortError')
    ) {
      throw new GithubError(
        504,
        'github_timeout',
        'O GitHub demorou demais para responder.',
      )
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

async function gh<T>(path: string, token: string): Promise<T> {
  const res = await request(path, token)
  return (await res.json()) as T
}

function normalizeRepo(repo: RawRepo): GithubRepo {
  return {
    nameWithOwner: repo.full_name,
    description: repo.description,
    primaryLanguage: repo.language,
    pushedAt: repo.pushed_at,
    url: repo.html_url,
    defaultBranch: repo.default_branch,
  }
}

/** Valida a credencial sem devolver qualquer informação sensível. */
export async function viewer(token: string): Promise<{ login: string }> {
  return gh<{ login: string }>('/user', token)
}

/** Repositórios acessíveis ao PAT, mais recentes primeiro. */
export async function repoList(
  token: string,
  limit = 100,
): Promise<GithubRepo[]> {
  const raw = await gh<RawRepo[]>(
    `/user/repos?sort=pushed&direction=desc&per_page=${Math.min(limit, 100)}`,
    token,
  )
  return raw.map(normalizeRepo)
}

export async function repoView(
  token: string,
  nameWithOwner: string,
): Promise<GithubRepo> {
  const path = repositoryPath(nameWithOwner)
  return normalizeRepo(await gh<RawRepo>(`/repos/${path}`, token))
}

export async function repoCommits(
  token: string,
  nameWithOwner: string,
  limit = 12,
): Promise<GithubCommit[]> {
  const path = repositoryPath(nameWithOwner)
  try {
    const raw = await gh<RawCommit[]>(
      `/repos/${path}/commits?per_page=${Math.min(limit, 50)}`,
      token,
    )
    return raw.slice(0, limit).map((item) => ({
      sha: item.sha,
      title:
        item.commit.message.split('\n')[0]?.trim().slice(0, 240) ||
        'Commit sem título',
      url: item.html_url,
      committedAt:
        item.commit.author?.date ?? item.commit.committer?.date ?? null,
    }))
  } catch (error) {
    // O GitHub usa 409 para repositório vazio.
    if (error instanceof GithubError && error.status === 409) return []
    throw error
  }
}

function trimTitle(value: string | null, fallback: string): string {
  return value?.trim().slice(0, 240) || fallback
}

/** Issues abertas. O endpoint /issues devolve pull requests junto — filtrados aqui. */
export async function repoIssues(
  token: string,
  nameWithOwner: string,
  limit = 10,
): Promise<GithubIssue[]> {
  const path = repositoryPath(nameWithOwner)
  const raw = await gh<RawIssue[]>(
    `/repos/${path}/issues?state=open&sort=updated&direction=desc&per_page=30`,
    token,
  )
  return raw
    .filter((item) => !item.pull_request)
    .slice(0, limit)
    .map((item) => ({
      number: item.number,
      title: trimTitle(item.title, 'Issue sem título'),
      url: item.html_url,
      updatedAt: item.updated_at,
    }))
}

export async function repoPulls(
  token: string,
  nameWithOwner: string,
  limit = 10,
): Promise<GithubPullRequest[]> {
  const path = repositoryPath(nameWithOwner)
  const raw = await gh<RawPull[]>(
    `/repos/${path}/pulls?state=open&sort=updated&direction=desc&per_page=${Math.min(limit, 50)}`,
    token,
  )
  return raw.slice(0, limit).map((item) => ({
    number: item.number,
    title: trimTitle(item.title, 'Pull request sem título'),
    draft: Boolean(item.draft),
    url: item.html_url,
    updatedAt: item.updated_at,
  }))
}

/** Execuções recentes do Actions. A resposta é um envelope, não um array. */
export async function repoWorkflowRuns(
  token: string,
  nameWithOwner: string,
  limit = 10,
): Promise<GithubWorkflowRun[]> {
  const path = repositoryPath(nameWithOwner)
  const raw = await gh<RawWorkflowRuns>(
    `/repos/${path}/actions/runs?per_page=${Math.min(limit, 50)}`,
    token,
  )
  return (raw.workflow_runs ?? []).slice(0, limit).map((item) => ({
    id: item.id,
    name: trimTitle(item.name, 'Workflow sem nome'),
    status: item.status,
    conclusion: item.conclusion,
    headBranch: item.head_branch,
    url: item.html_url,
    startedAt: item.run_started_at ?? item.updated_at ?? null,
  }))
}

export async function repoReadme(
  token: string,
  nameWithOwner: string,
  maxChars = 2_000,
): Promise<GithubReadme | null> {
  const path = repositoryPath(nameWithOwner)
  try {
    const raw = await gh<RawReadme>(`/repos/${path}/readme`, token)
    if (raw.encoding !== 'base64') {
      throw new GithubError(
        502,
        'github_failed',
        'O README veio em um formato não suportado.',
      )
    }
    const text = Buffer.from(
      raw.content.replace(/\s/g, ''),
      'base64',
    )
      .toString('utf8')
      .trim()
      .slice(0, maxChars)
    return text ? { text, path: raw.path, url: raw.html_url } : null
  } catch (error) {
    if (
      error instanceof GithubError &&
      error.code === 'github_not_found'
    ) {
      return null
    }
    throw error
  }
}

function warningFor(source: string, error: unknown): string {
  if (error instanceof GithubError) {
    if (error.code === 'github_timeout') {
      return `Não foi possível consultar ${source} a tempo.`
    }
    if (error.code === 'github_rate_limited') {
      return `Não foi possível consultar ${source} por limite do GitHub.`
    }
    // Fine-grained PAT sem o escopo da rota responde 403 (ou 404, quando o
    // GitHub prefere não revelar a existência do recurso).
    if (error.status === 403 || error.status === 404) {
      return `Não foi possível consultar ${source} — verifique as permissões do token do GitHub.`
    }
  }
  return `Não foi possível consultar ${source}.`
}

/**
 * Snapshot efêmero usado por uma única inferência. Nada é gravado no KV.
 * Falhas de autenticação/rate limit são bloqueantes; README/commits podem
 * produzir contexto parcial e um aviso verificável na interface.
 */
export async function repoContext(
  token: string,
  nameWithOwner: string,
): Promise<GithubContextSnapshot> {
  const normalizedToken = token.trim()
  if (!normalizedToken) {
    throw new GithubError(
      503,
      'github_not_configured',
      'Configure o GITHUB_TOKEN read-only na Vercel.',
    )
  }

  const [
    repoResult,
    readmeResult,
    commitsResult,
    issuesResult,
    pullsResult,
    ciResult,
  ] = await Promise.allSettled([
    repoView(normalizedToken, nameWithOwner),
    repoReadme(normalizedToken, nameWithOwner),
    repoCommits(normalizedToken, nameWithOwner),
    repoIssues(normalizedToken, nameWithOwner),
    repoPulls(normalizedToken, nameWithOwner),
    repoWorkflowRuns(normalizedToken, nameWithOwner),
  ])

  if (repoResult.status === 'rejected') {
    if (repoResult.reason instanceof GithubError) {
      throw repoResult.reason
    }
    throw new GithubError(
      502,
      'github_failed',
      'Não foi possível consultar os metadados do repositório.',
    )
  }

  for (const result of [
    readmeResult,
    commitsResult,
    issuesResult,
    pullsResult,
    ciResult,
  ]) {
    if (
      result.status === 'rejected' &&
      result.reason instanceof GithubError &&
      ['github_auth_failed', 'github_not_configured'].includes(
        result.reason.code,
      )
    ) {
      throw result.reason
    }
  }

  const warnings: string[] = []
  const repository = repoResult.value

  const readme =
    readmeResult.status === 'fulfilled' ? readmeResult.value : null
  if (readmeResult.status === 'rejected') {
    warnings.push(warningFor('o README', readmeResult.reason))
  } else if (!readme) {
    warnings.push('README não encontrado no repositório.')
  }

  const commits =
    commitsResult.status === 'fulfilled' ? commitsResult.value : []
  if (commitsResult.status === 'rejected') {
    warnings.push(warningFor('os commits recentes', commitsResult.reason))
  } else if (commits.length === 0) {
    warnings.push('Nenhum commit recente foi encontrado.')
  }

  // Saúde de desenvolvimento: lista vazia aqui é estado saudável (nada aberto,
  // nenhum CI configurado), então — ao contrário de README e commits — não vira
  // aviso nem marca o contexto como parcial. Só a falha da consulta avisa.
  const issues = issuesResult.status === 'fulfilled' ? issuesResult.value : []
  if (issuesResult.status === 'rejected') {
    warnings.push(warningFor('as issues abertas', issuesResult.reason))
  }

  const pullRequests =
    pullsResult.status === 'fulfilled' ? pullsResult.value : []
  if (pullsResult.status === 'rejected') {
    warnings.push(warningFor('os pull requests abertos', pullsResult.reason))
  }

  const ciRuns = ciResult.status === 'fulfilled' ? ciResult.value : []
  if (ciResult.status === 'rejected') {
    warnings.push(warningFor('as execuções de CI', ciResult.reason))
  }

  return {
    repository,
    readme,
    commits,
    issues,
    pullRequests,
    ciRuns,
    fetchedAt: new Date().toISOString(),
    partial: warnings.length > 0,
    warnings,
  }
}
