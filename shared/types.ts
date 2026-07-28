// Fonte única dos tipos de domínio (PRD.md §7) para as três variantes:
// frontend/src/lib/types.ts, backend/src/lib/types.ts e api/_lib/types.ts
// são apenas re-exports type-only deste arquivo (apagados em runtime).
// Editar aqui; nunca voltar a duplicar.

export type ProjectSource =
  | { kind: 'local'; path: string }
  | { kind: 'github'; nameWithOwner: string; cloneDir?: string }

export type ProjectStatus =
  | 'planning'
  | 'building'
  | 'review'
  | 'blocked'
  | 'done'

export interface Project {
  id: string
  name: string
  source: ProjectSource
  status: ProjectStatus
  nextAction?: string
  tags: string[]
  stack: string[]
  lastActivityAt?: string
  foundationId?: string
  createdAt: string
  updatedAt: string
  /**
   * Computado no GET /api/projects quando a pasta local (ou cloneDir) sumiu do
   * disco. NUNCA persistido no projects.json — o backend também força
   * status 'blocked' na resposta enquanto o caminho estiver ausente.
   */
  pathMissing?: boolean
}

export type LauncherKind = 'explorer' | 'terminal' | 'claude' | 'code' | 'cursor'
export type Launchers = Record<LauncherKind, boolean>

export type Density = 'compact' | 'comfortable' | 'spacious'

export interface Foundation {
  framework: string
  baseColor: string
  theme: string
  font: string
  radius: string
  density: Density
  iconLibrary: string
}

export type Template = {
  id: string
  name: string
  repoUrl: string
  description?: string
  createdAt: string
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatRequest = {
  projectId?: string
  messages: ChatMessage[]
}

export type ContextSource = {
  id: string
  kind: 'repository' | 'readme' | 'commit'
  label: string
  url?: string
  occurredAt?: string
}

export type ChatContext = {
  projectId: string
  projectName: string
  repository?: string
  fetchedAt: string
  status: 'complete' | 'partial'
  warnings: string[]
  sources: ContextSource[]
}

export type ChatResponse = {
  message: ChatMessage
  model: string
  context: ChatContext | null
  suggestedNextAction: string | null
}

// ── Modo Maestri (canvas de orquestração — branch canvas, desktop-only) ──
// A união completa entra de uma vez para não mexer no shared a cada fatia.

export type CanvasNodeKind =
  | 'terminal'
  | 'note'
  | 'text'
  | 'draw'
  | 'filetree'
  | 'group'

export type CanvasNodeData =
  | { kind: 'terminal'; title: string; role?: 'agent' | 'shell'; autorun?: 'claude' | 'codex' | null }
  | { kind: 'note'; title: string; file: string }
  | { kind: 'text'; text: string }
  | { kind: 'draw'; strokes: number[][][]; color: string }
  | { kind: 'filetree'; rootRel: string; depth: number }
  | { kind: 'group'; label: string }

export interface CanvasNode {
  id: string
  kind: CanvasNodeKind
  position: { x: number; y: number }
  width?: number
  height?: number
  parentId?: string
  data: CanvasNodeData
}

export interface CanvasEdge {
  id: string
  source: string
  target: string
  mode: 'manual' | 'auto'
  prefix?: string
}

export interface CanvasViewport {
  x: number
  y: number
  zoom: number
}

export interface Routine {
  id: string
  nodeId: string
  prompt: string
  intervalMinutes: number
  enabled: boolean
  lastRunAt?: string
}

export interface Floor {
  id: string
  name: string
  branch: string
  dir: string
  createdAt: string
}

export interface CanvasDoc {
  version: 1
  floorId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  viewport: CanvasViewport
  routines: Routine[]
  updatedAt: string
}
