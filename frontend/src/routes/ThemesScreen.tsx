import { useState } from 'react'
import { Check } from 'lucide-react'
import { themePresets, type ThemePreset } from '@/lib/themePresets'
import { clearPreset, getStoredPresetName, storePreset } from '@/lib/theme'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SWATCHES = ['primary', 'secondary', 'accent', 'muted', 'destructive'] as const

export function ThemesScreen() {
  const [active, setActive] = useState<string | null>(() => getStoredPresetName())

  function apply(preset: ThemePreset) {
    storePreset(preset)
    setActive(preset.name)
  }

  function reset() {
    clearPreset()
    setActive(null)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Temas</h1>
          <p className="text-sm text-muted-foreground">
            {themePresets.length} temas (via tweakcn) — aplica na hora, claro e escuro juntos.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset} disabled={!active}>
          Tema padrão
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themePresets.map((preset) => {
          const isActive = active === preset.name
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => apply(preset)}
              aria-pressed={isActive}
              className={cn(
                'relative rounded-lg border p-4 text-left shadow-sm transition-shadow hover:shadow-md',
                isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
              )}
              style={{
                backgroundColor: preset.light.background,
                color: preset.light.foreground,
                borderColor: preset.light.border,
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{preset.label}</span>
                {isActive && (
                  <Check
                    className="size-4 shrink-0"
                    style={{ color: preset.light.primary }}
                  />
                )}
              </div>
              <div className="flex gap-1.5">
                {SWATCHES.map((token) => (
                  <span
                    key={token}
                    className="size-6 rounded-full border"
                    style={{
                      backgroundColor: preset.light[token],
                      borderColor: preset.light.border,
                    }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
