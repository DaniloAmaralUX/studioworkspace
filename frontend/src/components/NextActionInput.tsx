import { useEffect, useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
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

  return (
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
  )
}
