import type { ReactNode } from 'react'
import { FolderPlus } from 'lucide-react'

/** Estado vazio do hub: orienta e oferece a proxima acao (better-writing #11). */
export function EmptyState({ action }: { action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-16 text-center">
      <FolderPlus className="mb-3 size-8 text-muted-foreground" />
      <p className="text-sm font-medium">Nenhum projeto ainda</p>
      <p className="mt-1 max-w-xs text-sm text-pretty text-muted-foreground">
        O hub reúne suas pastas locais e repositórios do GitHub num lugar só,
        com a próxima ação sempre à vista.
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
