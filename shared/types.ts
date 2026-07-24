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
