import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { usePatchProject } from '@/hooks/useProjects'

/** Próxima ação editável inline com auto-save (debounce). Sem "modo edição". */
export function NextActionInput({
  id,
  value,
}: {
  id: string
  value?: string
}) {
  const [text, setText] = useState(value ?? '')
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const patch = usePatchProject()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaved = useRef(value ?? '')

  // Sincroniza se o valor externo mudar (ex.: refetch).
  useEffect(() => {
    setText(value ?? '')
    lastSaved.current = value ?? ''
  }, [value])

  function save(next: string) {
    if (next === lastSaved.current) return
    setState('saving')
    patch.mutate(
      { id, patch: { nextAction: next } },
      {
        onSuccess: () => {
          lastSaved.current = next
          setState('saved')
          setTimeout(() => setState('idle'), 1200)
        },
        onError: () => setState('idle'),
      },
    )
  }

  function onChange(next: string) {
    setText(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => save(next), 700)
  }

  async function suggest() {
    setAiError(null)
    setAiLoading(true)
    try {
      const { suggestion } = await api.aiNextAction(id)
      if (timer.current) clearTimeout(timer.current)
      setText(suggestion)
      save(suggestion)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Falha ao gerar sugestão.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={text}
          placeholder="Qual é a próxima ação?"
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            if (timer.current) clearTimeout(timer.current)
            save(text)
          }}
          className="pr-8"
          aria-label="Próxima ação"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
          {state === 'saving' && <Loader2 className="size-4 animate-spin" />}
          {state === 'saved' && <Check className="size-4 text-emerald-500" />}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={suggest}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          Sugerir com IA
        </Button>
        {aiError && <span className="text-xs text-destructive">{aiError}</span>}
      </div>
    </div>
  )
}
