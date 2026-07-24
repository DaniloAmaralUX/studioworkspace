import { useContext, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { NodeProps } from '@xyflow/react'
import { FileText, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { CanvasContext } from '@/canvas/context'
import type { CanvasNodeData } from '@/lib/types'

type NoteData = Extract<CanvasNodeData, { kind: 'note' }>

// Nó de nota: o conteúdo vive num .md real no projeto. Edição local com
// autosave (debounce); atualização externa (agente editou) chega pelo query
// invalidado no WS de eventos e sincroniza quando o campo não está focado.
export function NoteNode({ id, data }: NodeProps) {
  const d = data as unknown as NoteData
  const { projectId, removeNode } = useContext(CanvasContext)
  const { data: note } = useQuery({
    queryKey: ['note', projectId, d.file],
    queryFn: () => api.getNote(projectId, d.file),
    enabled: !!projectId,
  })
  const [text, setText] = useState('')
  const focused = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const save = useMutation({
    mutationFn: (content: string) => api.putNote(projectId, d.file, content),
  })

  useEffect(() => {
    if (note && !focused.current) setText(note.content)
  }, [note])

  function onChange(v: string) {
    setText(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => save.mutate(v), 600)
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-2 py-1 text-xs font-medium">
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{d.title}</span>
        <button
          type="button"
          className="nodrag ml-auto text-muted-foreground transition-colors hover:text-destructive"
          onClick={() => removeNode(id)}
          title="Remover nota do canvas (o arquivo .md permanece)"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <textarea
        className="nodrag nowheel flex-1 resize-none bg-transparent p-2 font-mono text-xs leading-relaxed outline-none"
        value={text}
        placeholder="# markdown…"
        onFocus={() => {
          focused.current = true
        }}
        onBlur={() => {
          focused.current = false
        }}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
