import { FolderPlus } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] p-16 text-center">
      <FolderPlus className="mb-3 size-8 text-[var(--muted-foreground)]" />
      <p className="text-sm font-medium">Nenhum projeto ainda</p>
      <p className="mt-1 max-w-xs text-sm text-[var(--muted-foreground)]">
        Adicionar pastas locais e repositórios do GitHub chega na Fatia 1.
      </p>
    </div>
  )
}
