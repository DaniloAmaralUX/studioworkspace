import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Integração via `gh` CLI já autenticado. Nunca lê/guarda tokens.
// Sempre execFile (args array, sem shell) + timeout.
const pExecFile = promisify(execFile)
const GH_TIMEOUT = 15_000

export type GithubRepo = {
  nameWithOwner: string
  description: string | null
  primaryLanguage: string | null
  pushedAt: string | null
  url: string
}

type RawRepo = {
  nameWithOwner: string
  description?: string | null
  primaryLanguage?: { name: string } | null
  pushedAt?: string | null
  url: string
}

const REPO_FIELDS = 'nameWithOwner,description,primaryLanguage,pushedAt,url'

function normalize(r: RawRepo): GithubRepo {
  return {
    nameWithOwner: r.nameWithOwner,
    description: r.description ? r.description : null,
    primaryLanguage: r.primaryLanguage?.name ?? null,
    pushedAt: r.pushedAt ?? null,
    url: r.url,
  }
}

export async function ghAuthOk(): Promise<boolean> {
  try {
    await pExecFile('gh', ['auth', 'status'], {
      windowsHide: true,
      timeout: GH_TIMEOUT,
    })
    return true
  } catch {
    return false
  }
}

export async function ghRepoList(limit = 100): Promise<GithubRepo[]> {
  const { stdout } = await pExecFile(
    'gh',
    ['repo', 'list', '--json', REPO_FIELDS, '--limit', String(limit)],
    { windowsHide: true, timeout: GH_TIMEOUT, maxBuffer: 8 * 1024 * 1024 },
  )
  const raw = JSON.parse(stdout) as RawRepo[]
  return raw.map(normalize)
}

export async function ghRepoView(nameWithOwner: string): Promise<GithubRepo> {
  const { stdout } = await pExecFile(
    'gh',
    ['repo', 'view', nameWithOwner, '--json', REPO_FIELDS],
    { windowsHide: true, timeout: GH_TIMEOUT },
  )
  return normalize(JSON.parse(stdout) as RawRepo)
}

const CLONE_TIMEOUT = 120_000

export async function ghClone(
  nameWithOwner: string,
  destDir: string,
): Promise<void> {
  await pExecFile('gh', ['repo', 'clone', nameWithOwner, destDir], {
    windowsHide: true,
    timeout: CLONE_TIMEOUT,
  })
}
