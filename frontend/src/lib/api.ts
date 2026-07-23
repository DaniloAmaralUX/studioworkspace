import type { Launchers, LauncherKind, Project, ProjectStatus } from './types'

const BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5178/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
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
}

export type { ProjectStatus }
