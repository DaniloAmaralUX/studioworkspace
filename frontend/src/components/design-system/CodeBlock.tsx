import { CopyButton } from '@/components/CopyButton'

/**
 * `language` é aceito e ainda não usado: é a costura para trocar o <pre> por
 * highlight (Shiki) sem tocar em nenhum call site.
 */
export function CodeBlock({
  code,
  language = 'tsx',
  label,
  onCopied,
}: {
  code: string
  language?: 'tsx' | 'bash'
  label: string
  onCopied?: () => void
}) {
  return (
    <div className="relative min-w-0">
      <div className="absolute right-2 top-2 z-10">
        <CopyButton value={code} label={label} onCopied={onCopied} />
      </div>
      <pre
        data-language={language}
        className="max-h-96 overflow-auto rounded-lg border bg-background p-4 pr-24 text-xs leading-relaxed"
      >
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}
