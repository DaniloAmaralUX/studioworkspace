import { useContext } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Trash2, Type } from 'lucide-react'
import { CanvasContext } from '@/canvas/context'
import type { CanvasNodeData } from '@/lib/types'

type TextData = Extract<CanvasNodeData, { kind: 'text' }>

// Nó de texto simples: o conteúdo vive no próprio doc do canvas (canvas.json),
// então editar dispara o autosave do layout — sem arquivo separado.
export function TextNode({ id, data }: NodeProps) {
  const d = data as unknown as TextData
  const { patchNodeData, removeNode } = useContext(CanvasContext)

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-2 py-1 text-xs font-medium">
        <Type className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-muted-foreground">Texto</span>
        <button
          type="button"
          className="nodrag ml-auto text-muted-foreground transition-colors hover:text-destructive"
          onClick={() => removeNode(id)}
          title="Remover"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <textarea
        className="nodrag nowheel flex-1 resize-none bg-transparent p-2 text-sm outline-none"
        value={d.text}
        placeholder="anotação livre…"
        onChange={(e) => patchNodeData(id, { text: e.target.value })}
      />
    </div>
  )
}
