import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useAddGithubProject,
  useAddLocalProject,
  useGithubRepos,
  useScaffoldProject,
  useTemplates,
} from '@/hooks/useProjects'
import { timeAgo } from '@/lib/utils'

export function AddProjectDialog() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('criar')
  const [pathInput, setPathInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [repoQuery, setRepoQuery] = useState('')
  // aba Criar
  const [scName, setScName] = useState('')
  const [scParent, setScParent] = useState('')
  const [scBase, setScBase] = useState('blank')

  const addLocal = useAddLocalProject()
  const addGithub = useAddGithubProject()
  const scaffold = useScaffoldProject()
  const repos = useGithubRepos(open && tab === 'github')
  const templates = useTemplates()

  function close() {
    setOpen(false)
    setPathInput('')
    setNameInput('')
    setRepoQuery('')
    setScName('')
    setScParent('')
    setScBase('blank')
    addLocal.reset()
    addGithub.reset()
    scaffold.reset()
  }

  function submitLocal(e: FormEvent) {
    e.preventDefault()
    addLocal.mutate(
      { path: pathInput.trim(), name: nameInput.trim() || undefined },
      { onSuccess: close },
    )
  }

  function submitScaffold(e: FormEvent) {
    e.preventDefault()
    scaffold.mutate(
      {
        name: scName.trim(),
        parentDir: scParent.trim(),
        templateRepoUrl: scBase === 'blank' ? undefined : scBase,
      },
      {
        onSuccess: (res) => {
          const id = res.project.id
          close()
          navigate(`/projects/${id}`)
        },
      },
    )
  }

  const filteredRepos = (repos.data ?? []).filter((r) =>
    r.nameWithOwner.toLowerCase().includes(repoQuery.trim().toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
          <DialogDescription>
            Crie um projeto já no seu padrão, ou associe uma pasta/repo
            existente.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="criar">Criar</TabsTrigger>
            <TabsTrigger value="local">Pasta local</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
          </TabsList>

          <TabsContent value="criar">
            <form onSubmit={submitScaffold} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="sc-name">Nome do projeto</Label>
                <Input
                  id="sc-name"
                  value={scName}
                  onChange={(e) => setScName(e.target.value)}
                  placeholder="Meu Novo App"
                  // Dentro de dialog modal, focar o 1º campo é o padrão
                  // WAI-ARIA APG; a regra mira autofocus em carga de página.
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sc-parent">Pasta-mãe (onde criar)</Label>
                <Input
                  id="sc-parent"
                  value={scParent}
                  onChange={(e) => setScParent(e.target.value)}
                  placeholder="C:\Users\...\dev"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Base</Label>
                <Select value={scBase} onValueChange={setScBase}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blank">
                      Em branco (só o meu padrão)
                    </SelectItem>
                    {(templates.data ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.repoUrl}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="mt-px size-3.5 shrink-0 text-primary" />
                Cria uma pasta nova e já carimba suas regras de design + shadcn
                MCP. Qualquer IDE abre sabendo seu contexto.
              </p>
              {scaffold.isError && (
                <p className="text-sm text-destructive">
                  {(scaffold.error as Error).message}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={
                    !scName.trim() || !scParent.trim() || scaffold.isPending
                  }
                >
                  {scaffold.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Criar projeto
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="local">
            <form onSubmit={submitLocal} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ps-path">Caminho da pasta</Label>
                <Input
                  id="ps-path"
                  value={pathInput}
                  onChange={(e) => setPathInput(e.target.value)}
                  placeholder="C:\Users\...\meu-projeto"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ps-name">Nome (opcional)</Label>
                <Input
                  id="ps-name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="vazio = usa o nome da pasta"
                />
              </div>
              {addLocal.isError && (
                <p className="text-sm text-destructive">
                  {(addLocal.error as Error).message}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={!pathInput.trim() || addLocal.isPending}
                >
                  {addLocal.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Adicionar
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="github" className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={repoQuery}
                onChange={(e) => setRepoQuery(e.target.value)}
                placeholder="Filtrar repositórios"
                className="pl-8"
              />
            </div>
            {repos.isLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando repos via
                gh…
              </p>
            )}
            {repos.isError && (
              <p className="text-sm text-destructive">
                {(repos.error as Error).message}
              </p>
            )}
            {addGithub.isError && (
              <p className="text-sm text-destructive">
                {(addGithub.error as Error).message}
              </p>
            )}
            <div className="max-h-64 divide-y overflow-auto rounded-md border">
              {filteredRepos.map((r) => (
                <button
                  key={r.nameWithOwner}
                  type="button"
                  disabled={addGithub.isPending}
                  onClick={() =>
                    addGithub.mutate(r.nameWithOwner, { onSuccess: close })
                  }
                  className="flex w-full items-start justify-between gap-3 p-2.5 text-left hover:bg-accent disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {r.nameWithOwner}
                    </p>
                    {r.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {r.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    {r.primaryLanguage && <div>{r.primaryLanguage}</div>}
                    {r.pushedAt && <div>{timeAgo(r.pushedAt)}</div>}
                  </div>
                </button>
              ))}
              {repos.data && filteredRepos.length === 0 && (
                <p className="p-3 text-center text-sm text-muted-foreground">
                  Nenhum repo casa com o filtro.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
