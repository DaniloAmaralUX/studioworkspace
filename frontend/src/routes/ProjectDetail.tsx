import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, GitBranch } from 'lucide-react'
import { useProjectGit, useProjects } from '@/hooks/useProjects'
import { StatusBadge } from '@/components/StatusBadge'
import { SourceBadge } from '@/components/SourceBadge'
import { NextActionInput } from '@/components/NextActionInput'
import { OpenWithButtons } from '@/components/OpenWithButtons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getStoredPresetName } from '@/lib/theme'

export function ProjectDetail() {
  const { id = '' } = useParams()
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.id === id)
  const git = useProjectGit(id, !!project && project.source.kind === 'local')

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
        <StatusBadge status={project.status} />
      </div>

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
            <OpenWithButtons projectId={project.id} />
          </section>
        </TabsContent>

        <TabsContent value="engineering" className="pt-5">
          {project.source.kind !== 'local' ? (
            <p className="text-sm text-muted-foreground">
              Repositório GitHub — o status de código aparece após o clone (sob
              demanda, chega na Fatia 3).
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
