import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { PROJECTS_FILE } from '../config'
import { backupCorrupt, readJson, writeJsonAtomic } from '../lib/atomicJson'
import type { Project, ProjectSource, ProjectStatus } from '../lib/types'
import { seedProjects } from './seed'

let cache: Project[] | null = null
// Promise em voo: sem isto, dois GETs concorrentes no primeiro load fariam
// readJson/seed em paralelo — e com arquivo corrompido, o segundo veria ENOENT
// (após o rename p/ .bak do primeiro) e re-seedaria por cima.
let loading: Promise<Project[]> | null = null

async function doLoad(): Promise<Project[]> {
  // fallback null = arquivo nunca existiu → semeia; corruptFallback [] = o
  // arquivo existia e corrompeu (preservado em .bak-<ts>) → índice vazio SEM
  // re-seed, para o usuário perceber e poder recuperar o .bak.
  const existing = await readJson<Project[] | null>(PROJECTS_FILE, null, [])
  if (Array.isArray(existing)) {
    cache = existing
  } else if (existing !== null) {
    // JSON sintaticamente válido mas com shape errado (ex.: '{}' editado na
    // mão): mesmo tratamento de corrupção — preserva e serve índice vazio.
    await backupCorrupt(PROJECTS_FILE)
    cache = []
  } else {
    cache = seedProjects()
    await writeJsonAtomic(PROJECTS_FILE, cache)
  }
  return cache
}

export async function loadProjects(): Promise<Project[]> {
  if (cache) return cache
  if (!loading) {
    loading = doLoad().finally(() => {
      loading = null
    })
  }
  return loading
}

async function persist(list: Project[]): Promise<void> {
  cache = list
  await writeJsonAtomic(PROJECTS_FILE, list)
}

export async function getProject(id: string): Promise<Project | undefined> {
  const list = await loadProjects()
  return list.find((p) => p.id === id)
}

export type ProjectPatch = Partial<
  Pick<Project, 'name' | 'status' | 'nextAction' | 'tags'>
>

export async function patchProject(
  id: string,
  patch: ProjectPatch,
): Promise<Project | undefined> {
  const list = await loadProjects()
  const idx = list.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  const updated: Project = {
    ...list[idx]!,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  const next = [...list]
  next[idx] = updated
  await persist(next)
  return updated
}

export async function setCloneDir(
  id: string,
  cloneDir: string,
): Promise<Project | undefined> {
  const list = await loadProjects()
  const idx = list.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  const current = list[idx]!
  if (current.source.kind !== 'github') return current
  const updated: Project = {
    ...current,
    source: { ...current.source, cloneDir },
    updatedAt: new Date().toISOString(),
  }
  const next = [...list]
  next[idx] = updated
  await persist(next)
  return updated
}

export async function removeProject(id: string): Promise<boolean> {
  const list = await loadProjects()
  const next = list.filter((p) => p.id !== id)
  if (next.length === list.length) return false
  await persist(next)
  return true
}

function sameSource(a: ProjectSource, b: ProjectSource): boolean {
  if (a.kind === 'local' && b.kind === 'local') {
    return path.resolve(a.path).toLowerCase() === path.resolve(b.path).toLowerCase()
  }
  if (a.kind === 'github' && b.kind === 'github') {
    return a.nameWithOwner.toLowerCase() === b.nameWithOwner.toLowerCase()
  }
  return false
}

export async function findBySource(
  source: ProjectSource,
): Promise<Project | undefined> {
  const list = await loadProjects()
  return list.find((p) => sameSource(p.source, source))
}

export type NewProjectInput = {
  name: string
  source: ProjectSource
  status?: ProjectStatus
  tags?: string[]
  stack?: string[]
  nextAction?: string
  lastActivityAt?: string
}

export async function addProject(input: NewProjectInput): Promise<Project> {
  const list = await loadProjects()
  const now = new Date().toISOString()
  const project: Project = {
    id: randomUUID(),
    name: input.name,
    source: input.source,
    status: input.status ?? 'planning',
    nextAction: input.nextAction,
    tags: input.tags ?? [],
    stack: input.stack ?? [],
    lastActivityAt: input.lastActivityAt,
    createdAt: now,
    updatedAt: now,
  }
  await persist([...list, project])
  return project
}
