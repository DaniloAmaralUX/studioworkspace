import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { PROJECTS_FILE } from '../config'
import { readJson, writeJsonAtomic } from '../lib/atomicJson'

// Templates (boilerplates) que o usuário adiciona manualmente via link do repo.
// Nada é pré-populado. Guardado ao lado do índice de projetos.
const TEMPLATES_FILE = path.join(path.dirname(PROJECTS_FILE), 'templates.json')

export type Template = {
  id: string
  name: string
  repoUrl: string
  description?: string
  createdAt: string
}

export async function listTemplates(): Promise<Template[]> {
  return readJson<Template[]>(TEMPLATES_FILE, [])
}

export async function addTemplate(input: {
  name: string
  repoUrl: string
  description?: string
}): Promise<Template> {
  const list = await listTemplates()
  const tpl: Template = {
    id: randomUUID(),
    name: input.name,
    repoUrl: input.repoUrl,
    description: input.description,
    createdAt: new Date().toISOString(),
  }
  await writeJsonAtomic(TEMPLATES_FILE, [...list, tpl])
  return tpl
}

export async function removeTemplate(id: string): Promise<boolean> {
  const list = await listTemplates()
  const next = list.filter((t) => t.id !== id)
  if (next.length === list.length) return false
  await writeJsonAtomic(TEMPLATES_FILE, next)
  return true
}
