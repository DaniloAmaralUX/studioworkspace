import { FileText, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Barra flutuante para inserir nós no canvas.
export function Toolbar({
  onAddNote,
  onAddText,
}: {
  onAddNote: () => void
  onAddText: () => void
}) {
  return (
    <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-lg border bg-card/90 p-1 shadow-sm backdrop-blur">
      <Button variant="ghost" size="sm" onClick={onAddNote}>
        <FileText className="size-3.5" /> Nota
      </Button>
      <Button variant="ghost" size="sm" onClick={onAddText}>
        <Type className="size-3.5" /> Texto
      </Button>
    </div>
  )
}
