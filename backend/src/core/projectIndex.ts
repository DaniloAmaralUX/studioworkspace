import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { PROJECTS_FILE } from '../config'
import { readJson, writeJsonAtomic } from '../lib/atomicJson'
import type { Project, ProjectSource, ProjectStatus } from '../lib/types'
import { seedProjects } from './seed'

let cache: Project[] | null = null

export async function loadProjects(): Promise<Project[]> {
  if (cache) return cache
  const existing = await readJson<Project[] | null>(PROJECTS_FILE, null)
  if (existing) {
    cache = existing
  } else {
    cache = seedProjects()
    await writeJsonAtomic(PROJECTS_FILE, cache)
  }
  return cache
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
