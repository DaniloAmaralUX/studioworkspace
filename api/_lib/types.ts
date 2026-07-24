// Espelha backend/src/lib/types.ts e frontend/src/lib/types.ts (PRD §7).
// Na variante cloud só entram projetos GitHub, mas o tipo é o mesmo do desktop.

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
}

export type Template = {
  id: string
  name: string
  repoUrl: string
  description?: string
  createdAt: string
}
