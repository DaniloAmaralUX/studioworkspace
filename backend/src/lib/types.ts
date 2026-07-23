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

export type LauncherKind = 'explorer' | 'terminal' | 'claude' | 'code' | 'cursor'
