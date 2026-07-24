import { useState } from 'react'
import { Check, Copy, RotateCcw } from 'lucide-react'
import {
  themePresets,
  type ThemePreset,
  type ThemeVars,
} from '@/lib/themePresets'
import { clearPreset, getStoredPresetName, storePreset } from '@/lib/theme'

/** Base do registry (public/r/*.json sai no mesmo deploy do hub). */
const REGISTRY_URL = 'https://studioworkspace-mauve.vercel.app'
import { useTheme } from '@/app/ThemeProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Preview de um tema usando as próprias cores (oklch inline). */
function MiniPreview({ v }: { v: ThemeVars }) {
  const r = v.radius || '0.5rem'
  return (
    <div
      className="flex flex-col gap-2 border p-2.5"
      style={{
        background: v.background,
        borderColor: v.border,
        borderRadius: `calc(${r} + 4px)`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="px-2 py-0.5 text-[10px] font-bold"
          style={{ background: v.primary, color: v['primary-foreground'], borderRadius: r }}
        >
          Aa
        </span>
        <span
          className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
          style={{
            background: v.accent,
            color: v['accent-foreground'] ?? v.foreground,
          }}
        >
          badge
        </span>
      </div>
      <div
        className="flex flex-col gap-1.5 border p-2"
        style={{ background: v.card, borderColor: v.border, borderRadius: r }}
      >
        <span
          className="h-1 rounded-full"
          style={{ background: v.foreground, opacity: 0.85, width: '80%' }}
        />
        <span
          className="h-1 rounded-full"
          style={{ background: v['muted-foreground'], opacity: 0.5, width: '48%' }}
        />
      </div>
    </div>
  )
}

export function ThemesScreen() {
  const { resolved } = useTheme()
  const [active, setActive] = useState<string | null>(() => getStoredPresetName())
  const [copied, setCopied] = useState(false)

  const activePreset = themePresets.find((p) => p.name === active) ?? null
  const activeLabel = activePreset ? activePreset.label : 'Studio (padrão)'
  const applyCmd = activePreset
    ? `npx shadcn@latest add ${REGISTRY_URL}/r/${activePreset.name}.json`
    : null

  function apply(preset: ThemePreset) {
    storePreset(preset)
    setActive(preset.name)
  }
  function reset() {
    clearPreset()
    setActive(null)
  }
  function copyCmd() {
    if (!applyCmd) return
    navigator.clipboard.writeText(applyCmd).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Temas</h1>
          <span className="tnum text-sm text-muted-foreground">
            {themePresets.length} na biblioteca
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={reset} disabled={!active}>
          <RotateCcw className="size-3.5" />
          Tema padrão
        </Button>
      </header>

      {/* Detalhe do tema aplicado (usa os tokens vivos do app) */}
      <div className="mb-7 grid gap-4 md:grid-cols-[1fr_248px]">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-semibold tracking-tight">
              {activeLabel}
            </span>
            <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              aplicado
            </span>
          </div>
          <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
            <span className="h-1.5 w-2/3 rounded-full bg-foreground/80" />
            <span className="h-1.5 w-2/5 rounded-full bg-muted-foreground/50" />
            <div className="mt-1 flex gap-2">
              <span className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground">
                Primary
              </span>
              <span className="rounded-md border px-3 py-1.5 text-[11px] font-semibold">
                Ghost
              </span>
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            {['bg-background', 'bg-card', 'bg-primary', 'bg-accent', 'bg-border'].map(
              (c) => (
                <span key={c} className={cn('h-6 w-8 rounded-md border', c)} />
              ),
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-4">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Aplicar em outro projeto
            </p>
            <p className="text-xs text-muted-foreground">
              Cada tema é um item do seu registry — aplique em qualquer projeto
              com um comando.
            </p>
          </div>
          {applyCmd ? (
            <div className="flex items-center gap-2 overflow-x-auto rounded-lg border bg-background px-3 py-2 font-mono text-[11.5px]">
              <span className="text-primary">$</span>
              <span className="whitespace-nowrap">{applyCmd}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 shrink-0 px-2"
                onClick={copyCmd}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed bg-background px-3 py-2 text-xs text-muted-foreground">
              Aplique um tema da biblioteca para gerar o comando.
            </p>
          )}
        </div>
      </div>

      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Biblioteca · clique para aplicar
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {themePresets.map((preset) => {
          const v = resolved === 'dark' ? preset.dark : preset.light
          const isActive = active === preset.name
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => apply(preset)}
              aria-pressed={isActive}
              className={cn(
                'group flex flex-col gap-2.5 rounded-xl border bg-card p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-muted-foreground/40',
                isActive && 'border-primary/50 ring-2 ring-primary/25',
              )}
            >
              <MiniPreview v={v} />
              <div className="flex items-center justify-between px-0.5">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  {isActive && <Check className="size-3 text-primary" />}
                  {preset.label}
                </span>
                <span className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                  {resolved}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
