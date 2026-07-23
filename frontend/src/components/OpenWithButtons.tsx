import { FolderOpen, TerminalSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCloneProject, useLaunchers, useOpenProject } from '@/hooks/useProjects'
import type { LauncherKind, Project } from '@/lib/types'

const ITEMS: {
  kind: LauncherKind
  label: string
  icon: typeof FolderOpen
}[] = [
  { kind: 'explorer', label: 'Explorer', icon: FolderOpen },
  { kind: 'terminal', label: 'Terminal', icon: TerminalSquare },
  { kind: 'claude', label: 'Claude', icon: Sparkles },
]

export function OpenWithButtons({ project }: { project: Project }) {
  const { data: launchers } = useLaunchers()
  const open = useOpenProject()
  const clone = useCloneProject()

  const needsClone = project.source.kind === 'github' && !project.source.cloneDir

  async function handleClick(withTool: LauncherKind) {
    if (needsClone && project.source.kind === 'github') {
      const ok = confirm(
        `Clonar ${project.source.nameWithOwner} em work/ e abrir?`,
      )
      if (!ok) return
      try {
        await clone.mutateAsync(project.id)
      } catch (err) {
        alert(`Não deu pra clonar: ${(err as Error).message}`)
        return
      }
    }
    open.mutate(
      { id: project.id, withTool },
      {
        onError: (err) => alert(`Não deu pra abrir: ${(err as Error).message}`),
      },
    )
  }

  const busy = open.isPending || clone.isPending

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ITEMS.filter((it) => launchers?.[it.kind]).map((it) => (
        <Button
          key={it.kind}
          variant="outline"
          size="sm"
          disabled={busy}
          title={needsClone ? 'Clona o repositório em work/ antes de abrir' : undefined}
          onClick={() => void handleClick(it.kind)}
        >
          <it.icon className="size-3.5" />
          {it.label}
        </Button>
      ))}
    </div>
  )
}
