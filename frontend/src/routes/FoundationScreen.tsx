import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy } from 'lucide-react'
import { useFoundation, usePutFoundation, useProjects } from '@/hooks/useProjects'
import { themePresets } from '@/lib/themePresets'
import type { Density, Foundation } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const FRAMEWORKS = ['vite', 'next']
const BASE_COLORS = ['neutral', 'zinc', 'slate', 'stone', 'gray']
const FONTS = ['Inter', 'Geist', 'system']
const RADII = ['0rem', '0.3rem', '0.5rem', '0.625rem', '0.75rem', '1rem']
const DENSITIES: Density[] = ['compact', 'comfortable', 'spacious']
const ICONS = ['lucide', 'radix']

const DEFAULT_FOUNDATION: Foundation = {
  framework: 'vite',
  baseColor: 'neutral',
  theme: 'default',
  font: 'Inter',
  radius: '0.625rem',
  density: 'comfortable',
  iconLibrary: 'lucide',
}

const opt = (v: string) => ({ value: v, label: v })

function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function FoundationScreen() {
  const { id = '' } = useParams()
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.id === id)
  const isLocal = !!project && project.source.kind === 'local'
  const existing = useFoundation(id, isLocal)
  const save = usePutFoundation(id)

  const [f, setF] = useState<Foundation>(DEFAULT_FOUNDATION)
  const [copied, setCopied] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    if (!hydrated.current && existing.data) {
      hydrated.current = true
      if (existing.data.foundation) setF(existing.data.foundation)
    }
  }, [existing.data])

  const set = (k: keyof Foundation) => (v: string) =>
    setF((prev) => ({ ...prev, [k]: v }) as Foundation)

  const preset = useMemo(
    () => themePresets.find((p) => p.name === f.theme),
    [f.theme],
  )
  const previewStyle = useMemo(() => {
    const s: Record<string, string> = {}
    if (preset) for (const [k, v] of Object.entries(preset.light)) s['--' + k] = v
    s['--radius'] = f.radius
    return s as CSSProperties
  }, [preset, f.radius])

  const command = `npx shadcn@latest init -b ${f.baseColor}`

  if (!project) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
      </div>
    )
  }

  const themeOptions = [
    { value: 'default', label: 'Padrão (Studio)' },
    ...themePresets.map((p) => ({ value: p.name, label: p.label })),
  ]

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link
        to={`/projects/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {project.name}
      </Link>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        Configurar Foundation
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Escolha as bases; salvar grava <code>.workspace/foundation.json</code> e{' '}
        <code>.workspace/DESIGN.md</code> no projeto (nunca sobrescreve o DESIGN.md
        da raiz).
      </p>

      {!isLocal ? (
        <p className="text-sm text-muted-foreground">
          Disponível só para projeto local (clone o repo do GitHub antes).
        </p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Framework" value={f.framework} onChange={set('framework')} options={FRAMEWORKS.map(opt)} />
            <Field label="Base color" value={f.baseColor} onChange={set('baseColor')} options={BASE_COLORS.map(opt)} />
            <div className="col-span-2">
              <Field label="Tema" value={f.theme} onChange={set('theme')} options={themeOptions} />
            </div>
            <Field label="Fonte" value={f.font} onChange={set('font')} options={FONTS.map(opt)} />
            <Field label="Radius" value={f.radius} onChange={set('radius')} options={RADII.map(opt)} />
            <Field label="Densidade" value={f.density} onChange={set('density')} options={DENSITIES.map(opt)} />
            <Field label="Ícones" value={f.iconLibrary} onChange={set('iconLibrary')} options={ICONS.map(opt)} />
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Preview
              </p>
              <div
                style={previewStyle}
                className="rounded-[var(--radius)] border bg-background p-5 text-foreground"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold">Aa Preview</span>
                  <div className="flex gap-1.5">
                    <Badge>Badge</Badge>
                    <Badge variant="secondary">Sec</Badge>
                  </div>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Texto secundário no tema selecionado.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Primário</Button>
                  <Button size="sm" variant="secondary">
                    Secundário
                  </Button>
                  <Button size="sm" variant="outline">
                    Outline
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Comando shadcn
              </p>
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2">
                <code className="flex-1 truncate text-xs">{command}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => {
                    navigator.clipboard?.writeText(command)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => save.mutate(f)} disabled={save.isPending}>
                {save.isPending ? 'Salvando…' : 'Salvar foundation'}
              </Button>
              {save.isSuccess && (
                <span className="text-sm text-muted-foreground">
                  Salvo em <code>.workspace/</code> ✓
                </span>
              )}
              {save.isError && (
                <span className="text-sm text-destructive">
                  {(save.error as Error).message}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
