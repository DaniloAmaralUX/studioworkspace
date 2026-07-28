import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/CopyButton'
import { ComponentPreview } from '@/components/design-system/ComponentPreview'
import {
  catalog,
  categories,
  installCommand,
  type CatalogEntry,
} from '@/registry/catalog'
import { hasDemo } from '@/registry/demo-index'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

function CommandBar({
  command,
  label,
  onCopied,
}: {
  command: string
  label: string
  onCopied: () => void
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-background px-3 py-2">
      <span className="shrink-0 font-mono text-xs text-primary">$</span>
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs tabular-nums">
        {command}
      </code>
      <CopyButton value={command} label={label} onCopied={onCopied} />
    </div>
  )
}

function ComponentCard({
  entry,
  onCopied,
}: {
  entry: CatalogEntry
  /** Recebe a frase pronta para a região aria-live. */
  onCopied: (message: string) => void
}) {
  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold tracking-tight">
            {entry.title}
          </h3>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {entry.name}
          </Badge>
          {entry.docOnly && (
            <Badge variant="outline" className="text-[10px]">
              Sem demo
            </Badge>
          )}
        </div>
        <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
          {entry.description}
        </p>
      </div>

      {hasDemo(entry.name) && (
        <ComponentPreview
          name={entry.name}
          title={entry.title}
          onCopied={() => onCopied(`Código de ${entry.title} copiado.`)}
        />
      )}

      <div className="mt-auto">
        <CommandBar
          command={installCommand(entry.name)}
          label={`Copiar comando de ${entry.title}`}
          onCopied={() => onCopied(`Comando de ${entry.title} copiado.`)}
        />
      </div>
    </article>
  )
}

export function DesignSystemScreen() {
  useDocumentTitle('Design System')
  const [announcement, setAnnouncement] = useState('')

  function handleCopied(message: string) {
    setAnnouncement(message)
  }

  const byCategory = categories
    .map((category) => ({
      category,
      entries: catalog.filter((entry) => entry.category === category.id),
    }))
    .filter((group) => group.entries.length > 0)

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Design System</h1>
        <p className="mt-1 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Os componentes de interface que o Studio usa. Cada um traz o comando
          para instalar no projeto que você quiser.
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground tabular-nums">
          {catalog.length} componentes
        </p>
      </header>

      <div className="space-y-10">
        {byCategory.map(({ category, entries }) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <div className="mb-3 flex items-baseline gap-2">
              <h2
                id={`cat-${category.id}`}
                className="text-sm font-medium tracking-tight"
              >
                {category.label}
              </h2>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {entries.length}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {entries.map((entry) => (
                <ComponentCard
                  key={entry.name}
                  entry={entry}
                  onCopied={handleCopied}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        data-testid="copy-status"
      >
        {announcement}
      </div>
    </div>
  )
}
