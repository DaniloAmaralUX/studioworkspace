import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectRow } from '@/components/ProjectRow'
import { EmptyState } from '@/components/EmptyState'
import { AddProjectDialog } from '@/components/AddProjectDialog'
import { useProjects } from '@/hooks/useProjects'
import type { Project } from '@/lib/types'

function sourceText(p: Project): string {
  return p.source.kind === 'github' ? p.source.nameWithOwner : p.source.path
}

export function ProjectsScreen() {
  const { data, isLoading, isError, error, refetch } = useProjects()
  const [q, setQ] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Ctrl+K foca a busca ("achar rápido").
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    const term = q.trim().toLowerCase()
    if (!term) return data
    return data.filter((p) =>
      [p.name, sourceText(p), ...p.tags, ...p.stack, p.nextAction ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [data, q])

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Projetos</h1>
          <span className="tnum text-sm text-muted-foreground">
            {data ? `${data.length} ativos` : 'carregando…'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar (Ctrl+K)"
              className="w-56 pl-8"
            />
          </div>
          <AddProjectDialog />
        </div>
      </header>

      {isLoading && (
        <div className="overflow-hidden rounded-xl border bg-card">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
            >
              <Skeleton className="size-2 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <Card className="flex items-center gap-3 border-red-500/30 p-4 text-sm">
          <AlertTriangle className="size-5 text-red-500" />
          <div className="flex-1">
            <p className="font-medium">Workspace Service não respondeu.</p>
            <p className="text-muted-foreground">
              {(error as Error)?.message}. Suba o backend (
              <code>npm run dev</code> em <code>backend/</code>) e tente de novo.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </Card>
      )}

      {!isLoading && !isError && data && data.length === 0 && <EmptyState />}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card">
          {filtered.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhum projeto casa com “{q}”.
        </p>
      )}
    </div>
  )
}
