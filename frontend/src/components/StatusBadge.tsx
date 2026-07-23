import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/lib/types'

const MAP: Record<ProjectStatus, { label: string; dot: string }> = {
  planning: { label: 'Planejando', dot: 'bg-sky-500' },
  building: { label: 'Construindo', dot: 'bg-blue-500' },
  review: { label: 'Revisão', dot: 'bg-amber-500' },
  blocked: { label: 'Bloqueado', dot: 'bg-red-500' },
  done: { label: 'Concluído', dot: 'bg-emerald-500' },
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = MAP[status]
  return (
    <Badge className="shrink-0">
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </Badge>
  )
}
