import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronDown,
  FolderX,
  GitBranch,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useDeleteProject,
  usePatchProject,
  useProjectGit,
  useProjects,
} from '@/hooks/useProjects'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { StatusBadge } from '@/components/StatusBadge'
import { SourceBadge } from '@/components/SourceBadge'
import { NextActionInput } from '@/components/NextActionInput'
import { OpenWithButtons } from '@/components/OpenWithButtons'
import { StampButton } from '@/components/StampButton'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { getStoredPresetName } from '@/lib/theme'
import type { ProjectStatus } from '@/lib/types'

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: 'Planejando',
  building: 'Construindo',
  review: 'Em revisão',
  blocked: 'Bloqueado',
  done: 'Concluído',
}
const STATUS_ORDER: ProjectStatus[] = [
  'planning',
  'building',
  'review',
  'blocked',
  'done',
]

export function ProjectDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.id === id)
  const patch = usePatchProject()
  const del = useDeleteProject()
  const [removeOpen, setRemoveOpen] = useState(false)
  const git = useProjectGit(
    id,
    !!project &&
      (project.source.kind === 'local' || !!project.source.cloneDir),
  )
  useDocumentTitle(project?.name)

  const back = (
    <Link
      to="/"
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Projetos
    </Link>
  )

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        {back}
        <p className="mt-4 text-sm text-muted-foreground">
          Projeto não encontrado.
        </p>
      </div>
    )
  }

  const preset = getStoredPresetName()

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {back}

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <div className="mt-1.5">
            <SourceBadge source={project.source} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              // p-2.5 -m-2.5: infla a área de clique para >=40px (DESIGN.md §8)
              // sem mudar o tamanho visual da pílula (22px + 2×10px = 42px).
              className="inline-flex items-center gap-1 rounded-full p-2.5 -m-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Mudar status (atual: ${STATUS_LABEL[project.status]})`}
            >
              <StatusBadge status={project.status} />
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={project.status}
                onValueChange={(v) =>
                  patch.mutate(
                    { id: project.id, patch: { status: v as ProjectStatus } },
                    {
                      onError: (err) =>
                        toast.error('Não deu pra mudar o status', {
                          description: (err as Error).message,
                        }),
                    },
                  )
                }
              >
                {STATUS_ORDER.map((s) => (
                  <DropdownMenuRadioItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setRemoveOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Remover do hub
          </Button>
        </div>
      </div>

      {project.pathMissing && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
          <FolderX className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Pasta não encontrada no disco.
            </p>
            <p className="text-muted-foreground">
              O caminho associado sumiu (drive desconectado? pasta renomeada?).
              Reconecte o drive ou restaure a pasta no caminho original — o
              Studio desbloqueia sozinho na próxima atualização. Nada foi
              apagado do hub.
            </p>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              {project.source.kind === 'local'
                ? project.source.path
                : project.source.cloneDir}
            </p>
          </div>
        </div>
      )}

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover “{project.name}” do hub?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso só tira o projeto da lista do Studio. A pasta e os arquivos
              continuam intactos no disco — nada é apagado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() =>
                del.mutate(project.id, {
                  onSuccess: () => {
                    toast.success('Projeto removido do hub.')
                    void navigate('/')
                  },
                  onError: (err) =>
                    toast.error('Não deu pra remover', {
                      description: (err as Error).message,
                    }),
                })
              }
            >
              Remover do hub
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engineering">Engineering</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5 pt-5">
          <section>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Próxima ação
            </p>
            <NextActionInput id={project.id} value={project.nextAction} />
          </section>
          {project.stack.length > 0 && (
            <section>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Stack
              </p>
              <div className="flex flex-wrap gap-1">
                {project.stack.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </section>
          )}
          {project.tags.length > 0 && (
            <section className="text-sm text-muted-foreground">
              {project.tags.map((t) => (
                <span key={t} className="mr-2">
                  #{t}
                </span>
              ))}
            </section>
          )}
          <section>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Abrir
            </p>
            <OpenWithButtons project={project} />
          </section>

          <section>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Portabilidade
            </p>
            <p className="mb-2 max-w-prose text-xs text-muted-foreground">
              Escreve suas regras de design e a config do shadcn MCP dentro do
              projeto (AGENTS.md, CLAUDE.md, Cursor, Copilot, VS Code) — para
              qualquer IDE ou agente já conhecer seu contexto, sem depender de
              conta.
            </p>
            {project.source.kind === 'github' && !project.source.cloneDir ? (
              <p className="text-xs text-muted-foreground">
                Disponível depois de clonar o repositório.
              </p>
            ) : (
              <StampButton id={project.id} />
            )}
          </section>
        </TabsContent>

        <TabsContent value="engineering" className="pt-5">
          {project.source.kind === 'github' && !project.source.cloneDir ? (
            <p className="text-sm text-muted-foreground">
              Repositório GitHub ainda não clonado — o status de código aparece
              depois que você clonar (use um dos botões "Abrir" acima).
            </p>
          ) : git.isLoading ? (
            <p className="text-sm text-muted-foreground">Lendo git…</p>
          ) : git.data && git.data.isRepo ? (
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Branch</dt>
              <dd className="flex items-center gap-1 font-medium">
                <GitBranch className="size-3.5" />
                {git.data.branch}
              </dd>
              <dt className="text-muted-foreground">Não commitado</dt>
              <dd>{git.data.dirtyCount} arquivo(s)</dd>
              <dt className="text-muted-foreground">Ahead / behind</dt>
              <dd>
                {git.data.ahead} / {git.data.behind}
              </dd>
              <dt className="text-muted-foreground">Último commit</dt>
              <dd className="truncate">{git.data.lastCommit ?? '—'}</dd>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Essa pasta não é um repositório git.
            </p>
          )}
        </TabsContent>

        <TabsContent value="design" className="space-y-4 pt-5">
          <p className="text-sm text-muted-foreground">
            Tema aplicado no Studio:{' '}
            <span className="font-medium text-foreground">
              {preset ?? 'padrão'}
            </span>
            .
          </p>
          {project.source.kind === 'local' ? (
            <Button asChild>
              <Link to={`/projects/${project.id}/foundation`}>
                Configurar Foundation
              </Link>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              O configurador de Foundation fica disponível após clonar o
              repositório.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
