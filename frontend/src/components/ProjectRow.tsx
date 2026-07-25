import { Link } from 'react-router-dom'
import { ChevronRight, FolderX } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { timeAgo } from '@/lib/utils'
import type { Project } from '@/lib/types'

/** Linha densa estilo Linear: dot de status, nome, stack, próxima ação, pílula. */
export function ProjectRow({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40"
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: `var(--status-${project.status})` }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium tracking-tight">
            {project.name}
          </span>
          <span className="flex shrink-0 gap-1">
            {project.stack.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded border border-border/60 bg-muted/50 px-1.5 py-px font-mono text-[10.5px] text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </span>
        </div>
        {project.pathMissing ? (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-destructive">
            <FolderX className="size-3 shrink-0" />
            Pasta não encontrada no disco
          </p>
        ) : (
          project.nextAction && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {project.nextAction}
            </p>
          )
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge status={project.status} />
        <span className="tnum text-[11px] text-muted-foreground/70">
          {timeAgo(project.lastActivityAt)}
        </span>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </Link>
  )
}
