import { Folder, Github } from 'lucide-react'
import type { ProjectSource } from '@/lib/types'

export function SourceBadge({ source }: { source: ProjectSource }) {
  if (source.kind === 'github') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
        <Github className="size-3.5" />
        {source.nameWithOwner}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
      <Folder className="size-3.5" />
      {source.path}
    </span>
  )
}
