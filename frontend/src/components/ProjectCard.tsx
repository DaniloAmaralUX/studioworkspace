import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './StatusBadge'
import { SourceBadge } from './SourceBadge'
import { NextActionInput } from './NextActionInput'
import { OpenWithButtons } from './OpenWithButtons'
import { timeAgo } from '@/lib/utils'
import type { Project } from '@/lib/types'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight">
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>
        <SourceBadge source={project.source} />
        {project.stack.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {project.stack.map((s) => (
              <Badge
                key={s}
                className="bg-[var(--muted)] text-[var(--muted-foreground)]"
              >
                {s}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <p className="mb-1.5 text-xs font-medium text-[var(--muted-foreground)]">
          Próxima ação
        </p>
        <NextActionInput id={project.id} value={project.nextAction} />
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-3">
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>{timeAgo(project.lastActivityAt)}</span>
          <span className="flex gap-1.5">
            {project.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </span>
        </div>
        <OpenWithButtons projectId={project.id} />
      </CardFooter>
    </Card>
  )
}
