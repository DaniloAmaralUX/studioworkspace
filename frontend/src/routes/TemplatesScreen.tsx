import { useState, type FormEvent } from 'react'
import { Plus, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import {
  useAddTemplate,
  useRemoveTemplate,
  useTemplates,
} from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TemplatesScreen() {
  const templates = useTemplates()
  const add = useAddTemplate()
  const remove = useRemoveTemplate()
  const [name, setName] = useState('')
  const [repoUrl, setRepoUrl] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    add.mutate(
      { name: name.trim(), repoUrl: repoUrl.trim() },
      {
        onSuccess: () => {
          setName('')
          setRepoUrl('')
        },
      },
    )
  }

  const list = templates.data ?? []

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Boilerplates de partida — adicione os seus manualmente com o link do
          repositório.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="mb-4 grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
      >
        <div className="space-y-1.5">
          <Label htmlFor="tpl-name">Nome</Label>
          <Input
            id="tpl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: SaaS shadcn"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tpl-url">Link do repositório</Label>
          <Input
            id="tpl-url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
          />
        </div>
        <Button
          type="submit"
          disabled={!name.trim() || !repoUrl.trim() || add.isPending}
        >
          {add.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus />
          )}
          Adicionar
        </Button>
      </form>
      {add.isError && (
        <p className="mb-4 text-sm text-destructive">
          {(add.error as Error).message}
        </p>
      )}

      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nenhum template ainda. Adicione um acima.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {list.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.repoUrl}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  title="Abrir no navegador"
                >
                  <a href={t.repoUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  title="Remover"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(t.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
