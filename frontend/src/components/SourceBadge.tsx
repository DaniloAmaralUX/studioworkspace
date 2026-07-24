import { Folder } from 'lucide-react'
import { GithubIcon } from '@/components/GithubIcon'
import type { ProjectSource } from '@/lib/types'

export function SourceBadge({ source }: { source: ProjectSource }) {
  if (source.kind === 'github') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
        <GithubIcon className="size-3.5" />
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
