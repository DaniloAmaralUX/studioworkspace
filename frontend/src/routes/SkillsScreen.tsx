import { useEffect, useRef, useState } from 'react'
import {
  Accessibility,
  Activity,
  Apple,
  Blocks,
  BookOpenText,
  Check,
  Copy,
  ExternalLink,
  LayoutDashboard,
  Library,
  ListChecks,
  MousePointerClick,
  Palette,
  PanelsTopLeft,
  ScanSearch,
  Sparkles,
  Type,
  WandSparkles,
  WholeWord,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  skillCatalog,
  skillCollections,
  type SkillCatalogItem,
} from '@/lib/skillCatalog'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

const SKILL_ICONS: Record<string, LucideIcon> = {
  'better-accessibility': Accessibility,
  'better-colors': Palette,
  'better-interface': ScanSearch,
  'better-layout': LayoutDashboard,
  'better-typography': Type,
  'better-ui': Sparkles,
  'better-writing': WholeWord,
  'emil-design-eng': WandSparkles,
  'review-animations': Activity,
  'improve-animations': ListChecks,
  'find-animation-opportunities': MousePointerClick,
  'animation-vocabulary': BookOpenText,
  'apple-design': Apple,
  'pick-ui-library': Library,
  prototype: PanelsTopLeft,
}

function Command({
  value,
  label,
  copied,
  onCopy,
}: {
  value: string
  label: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-background px-3 py-2">
      <span className="shrink-0 font-mono text-xs text-primary">$</span>
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs tabular-nums">
        {value}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0"
        aria-label={label}
        onClick={onCopy}
      >
        {copied ? (
          <Check className="size-3.5" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
        {copied ? 'Copiado' : 'Copiar'}
      </Button>
    </div>
  )
}

function SkillCard({
  item,
  copied,
  onCopy,
}: {
  item: SkillCatalogItem
  copied: boolean
  onCopy: () => void
}) {
  const Icon = SKILL_ICONS[item.id] ?? Blocks

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              {item.title}
            </h2>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {item.id}
            </Badge>
          </div>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <p className="text-sm leading-relaxed">
          <span className="font-medium">Use para: </span>
          <span className="text-muted-foreground">{item.useWhen}</span>
        </p>
        <Command
          value={item.command}
          label={`Copiar comando de ${item.title}`}
          copied={copied}
          onCopy={onCopy}
        />
        <Button asChild variant="link" size="sm" className="h-auto px-0">
          <a href={item.sourceUrl} target="_blank" rel="noreferrer">
            Ver {item.title} no GitHub
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </article>
  )
}

export function SkillsScreen() {
  useDocumentTitle('Skills')
  const [copied, setCopied] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    [],
  )

  async function copy(command: string, id: string, title: string) {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(id)
      setAnnouncement(`Comando de ${title} copiado.`)
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setCopied(null), 1_400)
    } catch {
      toast.error('Não foi possível copiar o comando', {
        description: 'Selecione o comando e copie manualmente.',
      })
      setAnnouncement('Não foi possível copiar o comando.')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Skills</h1>
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {skillCatalog.length} disponíveis
          </span>
        </div>
        <p className="mt-1 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Leve regras especializadas de design e qualidade para qualquer
          projeto. Copie o comando e execute no terminal, na raiz do
          repositório.
        </p>
      </header>

      <section aria-labelledby="skills-kits-title" className="mb-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2
            id="skills-kits-title"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Instalar por coleção
          </h2>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {skillCollections.length} coleções
          </span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {skillCollections.map((collection) => (
            <article
              key={collection.id}
              className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Blocks className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold tracking-tight">
                    {collection.title}
                  </h3>
                  <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {collection.description}
                  </p>
                </div>
              </div>
              <div className="mt-auto space-y-2">
                <Command
                  value={collection.installCommand}
                  label={`Copiar comando da coleção ${collection.title}`}
                  copied={copied === `collection:${collection.id}`}
                  onCopy={() =>
                    void copy(
                      collection.installCommand,
                      `collection:${collection.id}`,
                      collection.title,
                    )
                  }
                />
                <Button
                  asChild
                  variant="link"
                  size="sm"
                  className="h-auto px-0"
                >
                  <a
                    href={collection.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver fonte no GitHub
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="space-y-8">
        {skillCollections.map((collection) => {
          const collectionSkills = skillCatalog.filter(
            (item) => item.collectionId === collection.id,
          )

          return (
            <section
              key={collection.id}
              aria-labelledby={`skills-${collection.id}-title`}
            >
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2
                    id={`skills-${collection.id}-title`}
                    className="text-sm font-semibold tracking-tight"
                  >
                    {collection.title}
                  </h2>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {collectionSkills.length} skills
                  </span>
                </div>
                <a
                  href={collection.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Ver coleção
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {collectionSkills.map((item) => (
                  <SkillCard
                    key={item.id}
                    item={item}
                    copied={copied === item.id}
                    onCopy={() => void copy(item.command, item.id, item.title)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <p
        role="status"
        aria-live="polite"
        className="sr-only"
        data-testid="copy-status"
      >
        {announcement}
      </p>
    </div>
  )
}
