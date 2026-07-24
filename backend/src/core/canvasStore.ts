import { promises as fs, watch, type FSWatcher } from 'node:fs'
import path from 'node:path'
import { readJson, writeJsonAtomic } from '../lib/atomicJson'
import type { CanvasDoc, Project } from '../lib/types'

// Persistência do canvas DENTRO do projeto-alvo, em `.workspace/canvas/`
// (mesmo racional de foundation.ts: nunca sobrescreve arquivos do usuário).
//   canvas.json                — doc do floor principal
//   floors/<floorId>.json      — docs de outros floors (M8)
//   notes/<id>.md              — notas markdown reais que os agentes editam

export function resolveProjectDir(project: Project): string | null {
  return project.source.kind === 'local'
    ? project.source.path
    : project.source.cloneDir ?? null
}

function canvasDir(projectDir: string): string {
  return path.join(projectDir, '.workspace', 'canvas')
}
function notesDir(projectDir: string): string {
  return path.join(canvasDir(projectDir), 'notes')
}
function docFile(projectDir: string, floorId: string): string {
  return floorId === 'main'
    ? path.join(canvasDir(projectDir), 'canvas.json')
    : path.join(canvasDir(projectDir), 'floors', `${floorId}.json`)
}

function emptyDoc(floorId: string): CanvasDoc {
  return {
    version: 1,
    floorId,
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    routines: [],
    updatedAt: new Date().toISOString(),
  }
}

export async function readCanvas(
  projectDir: string,
  floorId = 'main',
): Promise<CanvasDoc> {
  return readJson<CanvasDoc>(docFile(projectDir, floorId), emptyDoc(floorId))
}

export async function writeCanvas(
  projectDir: string,
  doc: CanvasDoc,
): Promise<void> {
  await writeJsonAtomic(docFile(projectDir, doc.floorId), {
    ...doc,
    updatedAt: new Date().toISOString(),
  })
}

// ── Notas ──
const NOTE_ID = /^[a-z0-9-]+$/
export function isValidNoteId(id: string): boolean {
  return NOTE_ID.test(id)
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || 'nota'
}

async function exists(p: string): Promise<boolean> {
  return fs
    .access(p)
    .then(() => true)
    .catch(() => false)
}

export async function readNote(projectDir: string, id: string): Promise<string> {
  return fs
    .readFile(path.join(notesDir(projectDir), `${id}.md`), 'utf8')
    .catch(() => '')
}

export async function writeNote(
  projectDir: string,
  id: string,
  content: string,
): Promise<void> {
  const dir = notesDir(projectDir)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, `${id}.md`), content, 'utf8')
}

export async function createNote(
  projectDir: string,
  title: string,
): Promise<{ id: string }> {
  const dir = notesDir(projectDir)
  await fs.mkdir(dir, { recursive: true })
  const slug = slugify(title)
  let id = slug
  let n = 1
  while (await exists(path.join(dir, `${id}.md`))) id = `${slug}-${++n}`
  await fs.writeFile(path.join(dir, `${id}.md`), `# ${title}\n\n`, 'utf8')
  return { id }
}

export async function deleteNote(
  projectDir: string,
  id: string,
): Promise<boolean> {
  return fs
    .unlink(path.join(notesDir(projectDir), `${id}.md`))
    .then(() => true)
    .catch(() => false)
}

// Observa a pasta de notas e chama onChange(noteId) com debounce (Windows
// dispara eventos duplicados). Retorna a função de parada.
export function watchNotes(
  projectDir: string,
  onChange: (noteId: string) => void,
): () => void {
  const dir = notesDir(projectDir)
  void fs.mkdir(dir, { recursive: true }).catch(() => {})
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  let watcher: FSWatcher | null = null
  try {
    watcher = watch(dir, (_evt, filename) => {
      if (typeof filename !== 'string' || !filename.endsWith('.md')) return
      const id = filename.replace(/\.md$/, '')
      const prev = timers.get(id)
      if (prev) clearTimeout(prev)
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id)
          onChange(id)
        }, 150),
      )
    })
  } catch {
    /* pasta ainda não existe — sem watcher até a primeira nota */
  }
  return () => {
    watcher?.close()
    timers.forEach((t) => clearTimeout(t))
    timers.clear()
  }
}
