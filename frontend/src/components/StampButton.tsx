import { useState } from 'react'
import { Check, Loader2, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, type StampAction, type StampResult } from '@/lib/api'

const ACTION_PT: Record<StampAction, string> = {
  created: 'criado',
  updated: 'atualizado',
  unchanged: 'sem mudança',
}

/**
 * Carimba o contexto de design (regras + config MCP) no projeto, para que
 * qualquer IDE/agente já conheça seu design system. Mostra o que foi escrito.
 */
export function StampButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StampResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setError(null)
    setLoading(true)
    try {
      setResult(await api.stampProject(id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao preparar o projeto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <PackageCheck className="size-3.5" />
        )}
        Preparar para qualquer IDE
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {result && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {result.files.map((f) => (
            <li key={f.file} className="flex items-center gap-1.5">
              <Check className="size-3 shrink-0 text-emerald-500" />
              <span className="font-mono tabular-nums">{f.file}</span>
              <span className="text-[0.7rem] uppercase tracking-wide opacity-70">
                {ACTION_PT[f.action]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
