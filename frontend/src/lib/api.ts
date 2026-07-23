import type {
  Foundation,
  Launchers,
  LauncherKind,
  Project,
  ProjectStatus,
} from './types'

const BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5178/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body?.error?.message ?? message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export type ProjectPatch = Partial<
  Pick<Project, 'name' | 'status' | 'nextAction' | 'tags'>
>

export type GithubRepo = {
  nameWithOwner: string
  description: string | null
  primaryLanguage: string | null
  pushedAt: string | null
  url: string
}

export type GitInfo =
  | { isRepo: false; reason?: string }
  | {
      isRepo: true
      branch: string
      dirtyCount: number
      lastCommit: string | null
      ahead: number
      behind: number
    }

export type Template = {
  id: string
  name: string
  repoUrl: string
  description?: string
  createdAt: string
}

export type FoundationResponse = {
  foundation: Foundation | null
  shadcnCommand: string | null
}

export const api = {
  health: () => req<{ ok: boolean }>('/health'),
  listProjects: () => req<Project[]>('/projects'),
  patchProject: (id: string, patch: ProjectPatch) =>
    req<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteProject: (id: string) =>
    req<{ ok: true }>(`/projects/${id}`, { method: 'DELETE' }),
  getLaunchers: () => req<Launchers>('/launchers'),
  openProject: (id: string, withTool: LauncherKind) =>
    req<{ ok: true; opened: string; with: LauncherKind }>(
      `/projects/${id}/open`,
      { method: 'POST', body: JSON.stringify({ with: withTool }) },
    ),
  addLocalProject: (path: string, name?: string) =>
    req<Project>('/projects/local', {
      method: 'POST',
      body: JSON.stringify({ path, name }),
    }),
  listGithubRepos: () => req<GithubRepo[]>('/github/repos'),
  addGithubProject: (nameWithOwner: string) =>
    req<Project>('/projects/github', {
      method: 'POST',
      body: JSON.stringify({ nameWithOwner }),
    }),
  cloneProject: (id: string) =>
    req<Project>(`/projects/${id}/clone`, { method: 'POST' }),
  getProjectGit: (id: string) => req<GitInfo>(`/projects/${id}/git`),
  getFoundation: (id: string) =>
    req<FoundationResponse>(`/projects/${id}/foundation`),
  putFoundation: (id: string, f: Foundation) =>
    req<{ foundation: Foundation; shadcnCommand: string; designPath: string }>(
      `/projects/${id}/foundation`,
      { method: 'PUT', body: JSON.stringify(f) },
    ),
  listTemplates: () => req<Template[]>('/templates'),
  addTemplate: (input: { name: string; repoUrl: string; description?: string }) =>
    req<Template>('/templates', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  removeTemplate: (id: string) =>
    req<{ ok: true }>(`/templates/${id}`, { method: 'DELETE' }),
}

export type { ProjectStatus }
