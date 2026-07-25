import { useState } from 'react'
import { FolderOpen, TerminalSquare, Sparkles, Code2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  { kind: 'code', label: 'VS Code', icon: Code2 },
  { kind: 'cursor', label: 'Cursor', icon: Code2 },
]

export function OpenWithButtons({ project }: { project: Project }) {
  const { data: launchers } = useLaunchers()
  const open = useOpenProject()
  const clone = useCloneProject()
  const [confirmTool, setConfirmTool] = useState<LauncherKind | null>(null)

  const needsClone = project.source.kind === 'github' && !project.source.cloneDir
  const cloneLabel =
    project.source.kind === 'github' ? project.source.nameWithOwner : ''

  function openWith(withTool: LauncherKind) {
    const label = ITEMS.find((it) => it.kind === withTool)?.label ?? withTool
    // DESIGN.md §6: toda abertura mostra feedback ("abrindo no …").
    toast.loading(`Abrindo no ${label}…`, { id: `open-${project.id}` })
    open.mutate(
      { id: project.id, withTool },
      {
        onSuccess: () =>
          toast.success(`Aberto no ${label}.`, { id: `open-${project.id}` }),
        onError: (err) =>
          toast.error('Não deu pra abrir', {
            id: `open-${project.id}`,
            description: (err as Error).message,
          }),
      },
    )
  }

  function handleClick(withTool: LauncherKind) {
    if (needsClone) {
      setConfirmTool(withTool)
      return
    }
    openWith(withTool)
  }

  async function confirmClone() {
    const withTool = confirmTool
    setConfirmTool(null)
    if (!withTool) return
    try {
      await toast.promise(clone.mutateAsync(project.id), {
        loading: `Clonando ${cloneLabel}…`,
        success: 'Repositório clonado.',
        error: (err) => `Não deu pra clonar: ${(err as Error).message}`,
      }).unwrap()
    } catch {
      return // erro já exibido pelo toast; não abre
    }
    openWith(withTool)
  }

  const busy = open.isPending || clone.isPending

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {ITEMS.filter((it) => launchers?.[it.kind]).map((it) => (
          <Button
            key={it.kind}
            variant="outline"
            size="sm"
            disabled={busy}
            title={
              needsClone ? 'Clona o repositório em work/ antes de abrir' : undefined
            }
            onClick={() => handleClick(it.kind)}
          >
            <it.icon className="size-3.5" />
            {it.label}
          </Button>
        ))}
      </div>

      <AlertDialog
        open={confirmTool !== null}
        onOpenChange={(o) => !o && setConfirmTool(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clonar antes de abrir?</AlertDialogTitle>
            <AlertDialogDescription>
              {cloneLabel} ainda não está na sua máquina. Vou clonar em{' '}
              <code className="font-mono">work/</code> e então abrir. Nada é
              movido nem sobrescrito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmClone()}>
              Clonar e abrir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
