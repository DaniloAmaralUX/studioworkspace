import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Server,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { api, type AiSettings } from '@/lib/api'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

const DEFAULT_REGION = 'us-east-2'
const DEFAULT_PROJECT_ID = 'proj_ehx5s4fo4ilbgxy45v2e'
const DEFAULT_MODEL = 'moonshotai.kimi-k2.5'

export function SettingsScreen() {
  useDocumentTitle('IA e APIs')
  const [settings, setSettings] = useState<AiSettings | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [region, setRegion] = useState(DEFAULT_REGION)
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID)
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    let active = true
    api
      .getAiSettings()
      .then((data) => {
        if (!active) return
        setSettings(data)
        setRegion(data.region)
        setProjectId(data.projectId ?? '')
        setModel(data.model)
      })
      .catch((error) => {
        toast.error('Não deu para ler a configuração de IA', {
          description: (error as Error).message,
        })
      })
    return () => {
      active = false
    }
  }, [])

  async function save() {
    setSaving(true)
    try {
      const next = await api.saveAiSettings({
        apiKey: apiKey.trim() || undefined,
        region,
        projectId: projectId.trim() || undefined,
        model,
      })
      setSettings(next)
      setApiKey('')
      toast.success('Chave do Bedrock salva.', {
        description: 'Use “Testar conexão” para validar com a AWS.',
      })
    } catch (error) {
      toast.error('Não deu para salvar a configuração', {
        description: (error as Error).message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function testConnection() {
    setTesting(true)
    try {
      const result = await api.testAiSettings()
      toast.success('Conexão com o Bedrock funcionando.', {
        description: `Modelo ${result.model}`,
      })
    } catch (error) {
      toast.error('A conexão com o Bedrock falhou', {
        description: (error as Error).message,
      })
    } finally {
      setTesting(false)
    }
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">IA e APIs</h1>
          <Badge variant={settings.configured ? 'default' : 'secondary'}>
            {settings.configured ? 'Chave salva' : 'Não configurado'}
          </Badge>
        </div>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Use seus créditos do Amazon Bedrock para as sugestões de próxima
          ação do Studio.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg border bg-muted/50 p-2">
              <Server className="size-4 text-primary" />
            </div>
            <div>
              <CardTitle>Amazon Bedrock</CardTitle>
              <CardDescription className="mt-1">
                Endpoint Mantle · OpenAI-compatible · United States (Ohio)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="bedrock-key">Chave de API do Bedrock</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                <Input
                  id="bedrock-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={
                    settings.configured
                      ? 'Chave salva — cole outra apenas para substituir'
                      : 'Cole sua chave do Amazon Bedrock'
                  }
                  autoComplete="off"
                  spellCheck={false}
                  className="pr-10 pl-9 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0"
                  onClick={() => setShowKey((visible) => !visible)}
                  aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                >
                  {showKey ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-status-done" />
              <p>
                Salva somente em <code className="font-mono">backend/.env</code>{' '}
                neste computador. A chave não volta para a tela, não entra no
                Git e não é enviada à versão cloud.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Use uma chave criada em{' '}
              <strong className="font-medium text-foreground">
                Amazon Bedrock → API keys
              </strong>
              . Chaves <code className="font-mono">sk-…</code> da OpenAI,
              Access Key ID e Project ID não funcionam neste campo.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bedrock-region">Região</Label>
              <Input
                id="bedrock-region"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="font-mono tnum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedrock-project">Project ID</Label>
              <Input
                id="bedrock-project"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="font-mono tnum"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedrock-model">Modelo</Label>
            <Input
              id="bedrock-model"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="font-mono"
            />
            <p className="truncate font-mono text-xs text-muted-foreground">
              {`https://bedrock-mantle.${region}.api.aws/v1`}
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={!settings.configured || testing || saving}
            >
              {testing ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Testar conexão
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={
                saving ||
                !region.trim() ||
                !model.trim() ||
                (!settings.configured && !apiKey.trim())
              }
            >
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              Salvar configuração
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
