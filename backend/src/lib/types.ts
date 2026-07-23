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
