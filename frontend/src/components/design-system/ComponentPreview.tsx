import { Suspense, useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeBlock } from '@/components/design-system/CodeBlock'
import { DemoErrorBoundary } from '@/components/design-system/DemoErrorBoundary'
import { demoComponents, loadDemoSource } from '@/registry/demo-index'

function DemoSource({
  name,
  title,
  onCopied,
}: {
  name: string
  title: string
  onCopied?: () => void
}) {
  const [source, setSource] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  // O Radix desmonta a aba inativa, então este efeito só roda quando o usuário
  // abre "Código" pela primeira vez — o fonte nunca é baixado à toa.
  useEffect(() => {
    let active = true
    loadDemoSource(name)
      .then((text) => {
        if (active) setSource(text)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [name])

  if (failed) {
    return (
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar o código deste exemplo.
      </p>
    )
  }

  if (source === null) {
    return <Skeleton className="h-40 w-full" />
  }

  return (
    <CodeBlock
      code={source}
      label={`Copiar código de ${title}`}
      onCopied={onCopied}
    />
  )
}

export function ComponentPreview({
  name,
  title,
  onCopied,
}: {
  name: string
  title: string
  onCopied?: () => void
}) {
  const Demo = demoComponents[name]
  if (!Demo) return null

  return (
    <Tabs defaultValue="preview">
      <TabsList variant="line" aria-label={`Exemplo de ${title}`}>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Código</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        <div className="flex min-h-[180px] items-center justify-center rounded-lg border bg-muted/30 p-6">
          <DemoErrorBoundary title={title}>
            <Suspense fallback={<Skeleton className="h-10 w-40" />}>
              <Demo />
            </Suspense>
          </DemoErrorBoundary>
        </div>
      </TabsContent>
      <TabsContent value="code">
        <DemoSource name={name} title={title} onCopied={onCopied} />
      </TabsContent>
    </Tabs>
  )
}
