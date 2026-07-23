import { useState, type FormEvent } from 'react'
import { Plus, Loader2, Search } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useAddGithubProject,
  useAddLocalProject,
  useGithubRepos,
} from '@/hooks/useProjects'
import { timeAgo } from '@/lib/utils'

export function AddProjectDialog() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('local')
  const [pathInput, setPathInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [repoQuery, setRepoQuery] = useState('')

  const addLocal = useAddLocalProject()
  const addGithub = useAddGithubProject()
  const repos = useGithubRepos(open && tab === 'github')

  function close() {
    setOpen(false)
    setPathInput('')
    setNameInput('')
    setRepoQuery('')
    addLocal.reset()
    addGithub.reset()
  }

  function submitLocal(e: FormEvent) {
    e.preventDefault()
    addLocal.mutate(
      { path: pathInput.trim(), name: nameInput.trim() || undefined },
      { onSuccess: close },
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
          <DialogTitle>Adicionar projeto</DialogTitle>
          <DialogDescription>
            Associe uma pasta local ou um repositório do GitHub. Nada é copiado
            ou movido.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="local">Pasta local</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
          </TabsList>

          <TabsContent value="local">
            <form onSubmit={submitLocal} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ps-path">Caminho da pasta</Label>
                <Input
                  id="ps-path"
                  value={pathInput}
                  onChange={(e) => setPathInput(e.target.value)}
                  placeholder="C:\Users\...\meu-projeto"
                  autoFocus
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
