import type {
  CanvasDoc,
  ChatRequest,
  ChatResponse,
  Foundation,
  Launchers,
  LauncherKind,
  Project,
} from './types'

const BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5178/api'

/** Variante cloud = API same-origin (VITE_API_BASE=/api na Vercel). */
export const IS_CLOUD = BASE.startsWith('/')

/** Base da API (para links de página inteira, ex.: /api/auth/login). */
export const API_BASE = BASE

/** Base WebSocket (Modo Maestri, desktop) — ws://127.0.0.1:5178/api. */
export const WS_BASE = BASE.replace(/^http/, 'ws')

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'same-origin',
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

export type GithubStatus = {
  authed: boolean
  login?: string
  via?: 'pat' | null
  error?: string
}

export type AiSettings = {
  configured: boolean
  provider: 'amazon-bedrock'
  region: string
  baseUrl: string
  projectId: string | null
  model: string
  storage: 'backend/.env'
}

export type StudioAuthStatus = {
  configured: boolean
  authenticated: boolean
}

export const api = {
  health: () => req<{ ok: boolean }>('/health'),
  studioAuthStatus: () =>
    req<StudioAuthStatus>('/auth/studio-status'),
  studioLogin: (password: string) =>
    req<{ ok: true }>('/auth/studio-login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  studioLogout: () =>
    req<{ ok: true }>('/auth/studio-logout', { method: 'POST' }),
  githubStatus: () => req<GithubStatus>('/github/status'),
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
    req<{ foundation: Foundation; shadcnCommand: string; designPath: string | null }>(
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
  aiNextAction: (id: string) =>
    req<{ suggestion: string }>(`/projects/${id}/ai-next-action`, {
      method: 'POST',
    }),
  getAiSettings: () => req<AiSettings>('/settings/ai'),
  saveAiSettings: (input: {
    apiKey?: string
    region: string
    projectId?: string
    model: string
  }) =>
    req<AiSettings>('/settings/ai', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  testAiSettings: () =>
    req<{ ok: true; model: string }>('/settings/ai/test', {
      method: 'POST',
    }),
  chat: (input: ChatRequest, signal?: AbortSignal) =>
    req<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(input),
      signal,
    }),
  stampProject: (id: string) =>
    req<StampResult>(`/projects/${id}/stamp`, { method: 'POST' }),
  scaffoldProject: (input: {
    name: string
    parentDir: string
    templateRepoUrl?: string
  }) =>
    req<{ project: Project; dir: string; cloned: boolean; stamped: string[] }>(
      '/projects/scaffold',
      { method: 'POST', body: JSON.stringify(input) },
    ),

  // ── Canvas (Modo Maestri, desktop-only) ──
  getCanvas: (id: string, floor = 'main') =>
    req<CanvasDoc>(`/projects/${id}/canvas?floor=${floor}`),
  putCanvas: (id: string, doc: CanvasDoc) =>
    req<{ ok: true }>(`/projects/${id}/canvas`, {
      method: 'PUT',
      body: JSON.stringify(doc),
    }),
  getNote: (id: string, noteId: string) =>
    req<{ content: string }>(`/projects/${id}/canvas/notes/${noteId}`),
  putNote: (id: string, noteId: string, content: string) =>
    req<{ ok: true }>(`/projects/${id}/canvas/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
  createNote: (id: string, title: string) =>
    req<{ id: string }>(`/projects/${id}/canvas/notes`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  deleteNote: (id: string, noteId: string) =>
    req<{ ok: true }>(`/projects/${id}/canvas/notes/${noteId}`, {
      method: 'DELETE',
    }),
}

export type StampAction = 'created' | 'updated' | 'unchanged'
export type StampResult = {
  dir: string
  files: { file: string; action: StampAction }[]
}

export type {
  ChatContext,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ContextSource,
  ProjectStatus,
} from './types'
