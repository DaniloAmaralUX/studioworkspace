// Persistência do Studio Cloud: Upstash Redis (Marketplace), substituindo o
// JSON atômico do desktop. Hashes por entidade — escrita atômica por campo.
import { Redis } from '@upstash/redis'
import type { Project, ProjectSource, Template } from './types.js'

const PROJECTS_KEY = 'ps:projects'
const TEMPLATES_KEY = 'ps:templates'

let client: Redis | null = null

function kv(): Redis {
  if (!client) {
    const url =
      process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
    const token =
      process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) {
      throw new Error(
        'KV não configurado: conecte o recurso Upstash (Marketplace) ao projeto studio-cloud.',
      )
    }
    client = new Redis({ url, token })
  }
  return client
}

export async function listProjects(): Promise<Project[]> {
  const map = await kv().hgetall<Record<string, Project>>(PROJECTS_KEY)
  const list = map ? Object.values(map) : []
  return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function getProject(id: string): Promise<Project | null> {
  return kv().hget<Project>(PROJECTS_KEY, id)
}

export async function putProject(project: Project): Promise<void> {
  await kv().hset(PROJECTS_KEY, { [project.id]: project })
}

export async function deleteProject(id: string): Promise<boolean> {
  return (await kv().hdel(PROJECTS_KEY, id)) > 0
}

export async function findBySource(
  source: ProjectSource,
): Promise<Project | undefined> {
  if (source.kind !== 'github') return undefined
  const list = await listProjects()
  return list.find(
    (p) =>
      p.source.kind === 'github' &&
      p.source.nameWithOwner.toLowerCase() ===
        source.nameWithOwner.toLowerCase(),
  )
}

export async function listTemplates(): Promise<Template[]> {
  const map = await kv().hgetall<Record<string, Template>>(TEMPLATES_KEY)
  const list = map ? Object.values(map) : []
  return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function putTemplate(template: Template): Promise<void> {
  await kv().hset(TEMPLATES_KEY, { [template.id]: template })
}

export async function deleteTemplate(id: string): Promise<boolean> {
  return (await kv().hdel(TEMPLATES_KEY, id)) > 0
}
