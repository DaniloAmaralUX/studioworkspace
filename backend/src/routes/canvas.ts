import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import { getProject } from '../core/projectIndex'
import {
  createNote,
  deleteNote,
  isValidNoteId,
  readCanvas,
  readNote,
  resolveProjectDir,
  watchNotes,
  writeCanvas,
  writeNote,
} from '../core/canvasStore'
import type { CanvasDoc } from '../lib/types'

// Rotas do "Modo Maestri" (canvas) — desktop-only. Plugin plano (não o
// type-provider) porque mistura rotas WebSocket e REST no mesmo arquivo; a
// validação de body é manual com zod (mesmo envelope { error: { code, message } }).

const canvasDocSchema = z.object({
  version: z.literal(1),
  floorId: z.string().min(1),
  nodes: z.array(
    z.object({
      id: z.string().min(1),
      kind: z.enum(['terminal', 'note', 'text', 'draw', 'filetree', 'group']),
      position: z.object({ x: z.number(), y: z.number() }),
      width: z.number().optional(),
      height: z.number().optional(),
      parentId: z.string().optional(),
      data: z.record(z.string(), z.unknown()),
    }),
  ),
  edges: z.array(
    z.object({
      id: z.string().min(1),
      source: z.string().min(1),
      target: z.string().min(1),
      mode: z.enum(['manual', 'auto']),
      prefix: z.string().optional(),
    }),
  ),
  viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }),
  routines: z
    .array(
      z.object({
        id: z.string(),
        nodeId: z.string(),
        prompt: z.string(),
        intervalMinutes: z.number().min(1),
        enabled: z.boolean(),
        lastRunAt: z.string().optional(),
      }),
    )
    .max(20)
    .default([]),
})

const noteContentSchema = z.object({ content: z.string() })
const noteCreateSchema = z.object({ title: z.string().min(1).max(80) })

function badBody(reply: FastifyReply, message: string): void {
  reply.code(400).send({ error: { code: 'invalid_body', message } })
}

// WS não sofre CORS do browser — validamos a origem no handshake. Aceita
// qualquer origem local (5177 no dev, 5178 no app empacotado); o server já
// só escuta 127.0.0.1. Sem origem (testes injectWS) passa.
function isLocalOrigin(origin?: string): boolean {
  if (!origin) return true
  try {
    const host = new URL(origin).hostname
    return host === '127.0.0.1' || host === 'localhost'
  } catch {
    return false
  }
}

// Resolve o dir do projeto em disco; responde 404/400 e retorna null se não der.
async function requireDir(
  id: string,
  reply: FastifyReply,
): Promise<string | null> {
  const project = await getProject(id)
  if (!project) {
    reply.code(404).send({ error: { code: 'not_found', message: 'Projeto não encontrado' } })
    return null
  }
  const dir = resolveProjectDir(project)
  if (!dir) {
    reply.code(400).send({
      error: { code: 'not_local', message: 'Canvas só para projeto local ou repo do GitHub já clonado.' },
    })
    return null
  }
  return dir
}

export async function canvasRoutes(app: FastifyInstance): Promise<void> {
  // Spike M0: echo (mantido como sonda de transporte).
  app.get('/api/canvas/ws-echo', { websocket: true }, (socket, req) => {
    if (!isLocalOrigin(req.headers.origin)) return socket.close(1008, 'origem')
    socket.on('message', (data: Buffer) => socket.send(data.toString()))
  })

  // Eventos do canvas: empurra { type:'note-changed', noteId } quando um .md muda
  // (o agente edita pelo CLI → fs.watch → aqui → o nó re-renderiza no front).
  app.get(
    '/api/projects/:id/canvas/events',
    { websocket: true },
    async (socket, req) => {
      if (!isLocalOrigin(req.headers.origin)) return socket.close(1008, 'origem')
      const { id } = req.params as { id: string }
      const project = await getProject(id)
      const dir = project ? resolveProjectDir(project) : null
      if (!dir) return socket.close(1011, 'projeto sem diretório')
      const stop = watchNotes(dir, (noteId) => {
        socket.send(JSON.stringify({ type: 'note-changed', noteId }))
      })
      socket.on('close', stop)
    },
  )

  // ── Layout ──
  app.get('/api/projects/:id/canvas', async (req, reply) => {
    const { id } = req.params as { id: string }
    const floor = typeof (req.query as { floor?: string }).floor === 'string'
      ? (req.query as { floor: string }).floor
      : 'main'
    const dir = await requireDir(id, reply)
    if (!dir) return
    return readCanvas(dir, floor)
  })

  app.put('/api/projects/:id/canvas', async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = canvasDocSchema.safeParse(req.body)
    if (!parsed.success) return badBody(reply, parsed.error.message)
    const dir = await requireDir(id, reply)
    if (!dir) return
    await writeCanvas(dir, parsed.data as unknown as CanvasDoc)
    return { ok: true }
  })

  // ── Notas ──
  app.post('/api/projects/:id/canvas/notes', async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = noteCreateSchema.safeParse(req.body)
    if (!parsed.success) return badBody(reply, parsed.error.message)
    const dir = await requireDir(id, reply)
    if (!dir) return
    const created = await createNote(dir, parsed.data.title)
    return reply.code(201).send(created)
  })

  app.get('/api/projects/:id/canvas/notes/:noteId', async (req, reply) => {
    const { id, noteId } = req.params as { id: string; noteId: string }
    if (!isValidNoteId(noteId)) return badBody(reply, 'noteId inválido')
    const dir = await requireDir(id, reply)
    if (!dir) return
    return { content: await readNote(dir, noteId) }
  })

  app.put('/api/projects/:id/canvas/notes/:noteId', async (req, reply) => {
    const { id, noteId } = req.params as { id: string; noteId: string }
    if (!isValidNoteId(noteId)) return badBody(reply, 'noteId inválido')
    const parsed = noteContentSchema.safeParse(req.body)
    if (!parsed.success) return badBody(reply, parsed.error.message)
    const dir = await requireDir(id, reply)
    if (!dir) return
    await writeNote(dir, noteId, parsed.data.content)
    return { ok: true }
  })

  app.delete('/api/projects/:id/canvas/notes/:noteId', async (req, reply) => {
    const { id, noteId } = req.params as { id: string; noteId: string }
    if (!isValidNoteId(noteId)) return badBody(reply, 'noteId inválido')
    const dir = await requireDir(id, reply)
    if (!dir) return
    const ok = await deleteNote(dir, noteId)
    if (!ok) {
      return reply.code(404).send({ error: { code: 'not_found', message: 'Nota não encontrada' } })
    }
    return { ok: true }
  })
}
