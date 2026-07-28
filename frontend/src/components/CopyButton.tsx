import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const RESET_MS = 1400

/**
 * Botão de copiar autocontido: guarda o próprio estado, limpa o timer no
 * unmount e degrada com toast quando o clipboard falha (contexto inseguro,
 * permissão negada). `onCopied` alimenta a região aria-live de quem usa.
 */
export function CopyButton({
  value,
  label,
  onCopied,
  className,
}: {
  /** Texto que vai para a área de transferência. */
  value: string
  /** Rótulo acessível, ex.: "Copiar comando de Button". */
  label: string
  /** Chamado após uma cópia bem-sucedida — quem chama compõe o anúncio. */
  onCopied?: () => void
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      onCopied?.()
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), RESET_MS)
    } catch {
      toast.error('Não foi possível copiar', {
        description: 'Selecione o comando e copie manualmente.',
      })
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('shrink-0', className)}
      aria-label={label}
      onClick={copy}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  )
}
