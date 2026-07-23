import { FolderOpen, TerminalSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLaunchers, useOpenProject } from '@/hooks/useProjects'
import type { LauncherKind } from '@/lib/types'

const ITEMS: {
  kind: LauncherKind
  label: string
  icon: typeof FolderOpen
  // `claude://` ainda é stub no backend (Fatia 3) — mostramos o botão porém
  // desabilitado, em vez de deixar o clique sempre falhar com alert.
  comingSoon?: boolean
}[] = [
  { kind: 'explorer', label: 'Explorer', icon: FolderOpen },
  { kind: 'terminal', label: 'Terminal', icon: TerminalSquare },
  { kind: 'claude', label: 'Claude', icon: Sparkles, comingSoon: true },
]

export function OpenWithButtons({ projectId }: { projectId: string }) {
  const { data: launchers } = useLaunchers()
  const open = useOpenProject()

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ITEMS.filter((it) => launchers?.[it.kind]).map((it) => (
        <Button
          key={it.kind}
          variant="outline"
          size="sm"
          disabled={open.isPending || it.comingSoon}
          title={
            it.comingSoon
              ? 'Abrir no Claude Code Desktop chega na Fatia 3'
              : undefined
          }
          onClick={
            it.comingSoon
              ? undefined
              : () =>
                  open.mutate(
                    { id: projectId, withTool: it.kind },
                    {
                      onError: (err) =>
                        alert(`Não deu pra abrir: ${(err as Error).message}`),
                    },
                  )
          }
        >
          <it.icon className="size-3.5" />
          {it.label}
        </Button>
      ))}
    </div>
  )
}
