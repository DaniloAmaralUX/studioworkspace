import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useProjects } from '@/hooks/useProjects'
import { api } from '@/lib/api'
import { useCanvasDoc } from '@/canvas/useCanvasDoc'
import { useCanvasEvents } from '@/canvas/useCanvasEvents'
import { CanvasContext } from '@/canvas/context'
import { NoteNode } from '@/canvas/nodes/NoteNode'
import { TextNode } from '@/canvas/nodes/TextNode'
import { Toolbar } from '@/canvas/Toolbar'

const nodeTypes = { note: NoteNode, text: TextNode }

function rid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
function scatter(): { x: number; y: number } {
  return { x: 80 + Math.random() * 160, y: 90 + Math.random() * 140 }
}

export default function CanvasScreen() {
  const { id = '' } = useParams()
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.id === id)
  const qc = useQueryClient()
  const doc = useCanvasDoc(id)

  useCanvasEvents(
    id,
    useCallback(
      (noteId: string) => {
        void qc.invalidateQueries({ queryKey: ['note', id, noteId] })
      },
      [qc, id],
    ),
  )

  const ctx = useMemo(
    () => ({ projectId: id, removeNode: doc.removeNode, patchNodeData: doc.patchNodeData }),
    [id, doc.removeNode, doc.patchNodeData],
  )

  const addText = useCallback(() => {
    doc.addNode({
      id: rid('text'),
      type: 'text',
      position: scatter(),
      data: { kind: 'text', text: '' } as unknown as Record<string, unknown>,
      width: 240,
      height: 120,
    })
  }, [doc])

  const addNote = useCallback(async () => {
    const { id: noteId } = await api.createNote(id, 'Nota')
    doc.addNode({
      id: `note-${noteId}`,
      type: 'note',
      position: scatter(),
      data: { kind: 'note', title: 'Nota', file: noteId } as unknown as Record<string, unknown>,
      width: 260,
      height: 200,
    })
  }, [doc, id])

  const saveLabel =
    doc.save === 'saving' ? 'salvando…' : doc.save === 'saved' ? 'salvo' : ''

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-4 py-2.5">
        <Link
          to={`/projects/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {project?.name ?? 'Projeto'}
        </Link>
        <span className="text-sm font-semibold tracking-tight">Canvas</span>
        {saveLabel && (
          <span className="text-xs text-muted-foreground">{saveLabel}</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          Modo Maestri · orquestração de agentes
        </span>
      </header>
      <div className="relative flex-1">
        <CanvasContext.Provider value={ctx}>
          <Toolbar onAddNote={addNote} onAddText={addText} />
          <ReactFlow
            nodes={doc.nodes}
            edges={doc.edges}
            onNodesChange={doc.onNodesChange}
            onEdgesChange={doc.onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.25}
            maxZoom={2}
            snapGrid={[16, 16]}
            snapToGrid
            deleteKeyCode={null}
            onlyRenderVisibleElements
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </CanvasContext.Provider>
      </div>
    </div>
  )
}
