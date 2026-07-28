import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Bot,
  BookOpenText,
  Check,
  ChevronsUpDown,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleX,
  ExternalLink,
  FolderGit2,
  GitCommitHorizontal,
  GitPullRequest,
  LoaderCircle,
  MessageSquareText,
  Save,
  Send,
  TriangleAlert,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { usePatchProject, useProjects } from '@/hooks/useProjects'
import {
  api,
  IS_CLOUD,
  type ChatContext,
  type ChatMessage,
  type ContextSource,
} from '@/lib/api'
import type { Project } from '@/lib/types'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { cn } from '@/lib/utils'

type UiMessage = ChatMessage & {
  id: string
  context?: ChatContext | null
  suggestedNextAction?: string | null
}

type ActiveRequest = {
  id: string
  controller: AbortController
}

const GENERAL_CONTEXT = '__general_context__'
const NO_PROJECTS = '__no_context_projects__'

function createWelcome(project?: Project): UiMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    content: project
      ? `Olá! O contexto de ${project.name} está ativo. Pergunte pelo estado do projeto, pelo que mudou ou pela próxima ação.`
      : 'Olá! Sou o Context Project. Escolha um projeto para conversar com o contexto do GitHub ou continue em uma conversa geral.',
  }
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Horário indisponível'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Fortaleza',
  }).format(date)
}

function safeExternalUrl(value?: string) {
  if (!value) return undefined

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : undefined
  } catch {
    return undefined
  }
}

function sourceIcon(source: ContextSource) {
  if (source.kind === 'commit') return GitCommitHorizontal
  if (source.kind === 'readme') return BookOpenText
  if (source.kind === 'issue') return CircleDot
  if (source.kind === 'pull') return GitPullRequest
  if (source.kind === 'check') {
    if (source.state === 'success') return CircleCheck
    if (source.state === 'failure') return CircleX
    return CircleDashed
  }
  return FolderGit2
}

function sourceIconTone(source: ContextSource) {
  if (source.kind !== 'check') return 'text-muted-foreground'
  if (source.state === 'success') return 'text-status-done'
  if (source.state === 'failure') return 'text-status-blocked'
  return 'text-muted-foreground'
}

// Ordem de leitura: identidade do repo primeiro, trabalho aberto no meio,
// histórico no fim. Grupo vazio não aparece.
const SOURCE_GROUPS: { kind: ContextSource['kind']; label: string }[] = [
  { kind: 'repository', label: 'Repositório' },
  { kind: 'readme', label: 'README' },
  { kind: 'issue', label: 'Issues abertas' },
  { kind: 'pull', label: 'Pull requests abertos' },
  { kind: 'check', label: 'CI recente' },
  { kind: 'commit', label: 'Commits recentes' },
]

function groupSources(sources: ContextSource[]) {
  const groups = SOURCE_GROUPS.map((group) => ({
    ...group,
    items: sources.filter((source) => source.kind === group.kind),
  })).filter((group) => group.items.length > 0)

  // Kind desconhecido (contrato mais novo que esta build) nunca some da lista.
  const known = new Set(SOURCE_GROUPS.map((group) => group.kind))
  const rest = sources.filter((source) => !known.has(source.kind))
  if (rest.length > 0) {
    groups.push({ kind: 'repository', label: 'Outras fontes', items: rest })
  }
  return groups
}

function SourceItem({ source }: { source: ContextSource }) {
  const Icon = sourceIcon(source)
  const url = safeExternalUrl(source.url)
  const content = (
    <>
      <Icon
        className={cn('mt-0.5 size-3.5 shrink-0', sourceIconTone(source))}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{source.label}</span>
        {source.occurredAt && (
          <span className="block font-mono text-[10px] text-muted-foreground tnum">
            {formatDateTime(source.occurredAt)}
          </span>
        )}
      </span>
      {url && (
        <ExternalLink
          className="mt-0.5 size-3 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </>
  )

  return (
    <li>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {content}
        </a>
      ) : (
        <div className="flex min-w-0 items-start gap-2 px-2 py-1.5 text-xs">
          {content}
        </div>
      )}
    </li>
  )
}

function ContextDetails({ context }: { context: ChatContext }) {
  return (
    <aside
      className="mt-2 space-y-3 rounded-xl border bg-muted/30 p-3"
      aria-label={`Contexto consultado para ${context.projectName}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{context.projectName}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground tnum">
            Consultado em {formatDateTime(context.fetchedAt)}
          </p>
        </div>
        <Badge
          variant={context.status === 'complete' ? 'secondary' : 'outline'}
        >
          {context.status === 'complete' ? 'Completo' : 'Parcial'}
        </Badge>
      </div>

      {context.repository && (
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {context.repository}
        </p>
      )}

      {context.warnings.length > 0 && (
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Contexto parcial</AlertTitle>
          <AlertDescription>
            <ul className="list-inside list-disc">
              {context.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {context.sources.length > 0 ? (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-between px-2"
            >
              <span>
                {context.sources.length}{' '}
                {context.sources.length === 1 ? 'fonte consultada' : 'fontes consultadas'}
              </span>
              <ChevronsUpDown aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-3 border-t pt-2">
              {groupSources(context.sources).map((group) => (
                <section key={group.label} aria-label={group.label}>
                  <h4 className="px-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h4>
                  <ul className="mt-1 space-y-1.5">
                    {group.items.map((source) => (
                      <SourceItem key={source.id} source={source} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhuma fonte ficou disponível nesta consulta.
        </p>
      )}
    </aside>
  )
}

function SuggestedActionCard({
  projectId,
  suggestion,
  currentNextAction,
}: {
  projectId: string
  suggestion: string
  currentNextAction?: string
}) {
  const patch = usePatchProject()
  const [saved, setSaved] = useState(
    currentNextAction?.trim() === suggestion.trim(),
  )
  const [error, setError] = useState<string | null>(null)
  const alreadySaved =
    saved || currentNextAction?.trim() === suggestion.trim()

  function saveSuggestion() {
    setError(null)
    patch.mutate(
      { id: projectId, patch: { nextAction: suggestion } },
      {
        onSuccess: () => setSaved(true),
        onError: (cause) => {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível salvar a próxima ação.',
          )
        },
      },
    )
  }

  return (
    <Card className="mt-2 gap-3 py-4 shadow-none">
      <CardHeader className="gap-1 px-4">
        <CardTitle className="text-sm">Próxima ação sugerida</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-sm leading-relaxed">{suggestion}</p>
        {error && (
          <Alert variant="destructive" className="mt-3">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Não foi possível salvar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="px-4">
        <Button
          type="button"
          size="sm"
          variant={alreadySaved ? 'secondary' : 'default'}
          onClick={saveSuggestion}
          disabled={patch.isPending || alreadySaved}
        >
          {patch.isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : alreadySaved ? (
            <Check aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {patch.isPending
            ? 'Salvando…'
            : alreadySaved
              ? 'Próxima ação salva'
              : error
                ? 'Tentar salvar novamente'
                : 'Salvar como próxima ação'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ChatScreen() {
  useDocumentTitle('Context Project')
  const projectsQuery = useProjects()
  const projects = (projectsQuery.data ?? []).filter(
    (project) => !IS_CLOUD || project.source.kind === 'github',
  )
  const [selectedContext, setSelectedContext] = useState(GENERAL_CONTEXT)
  const selectedProject = projects.find(
    (project) => project.id === selectedContext,
  )
  const [messages, setMessages] = useState<UiMessage[]>([createWelcome()])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const [pendingContext, setPendingContext] = useState<string | null>(null)
  const [changeDialogOpen, setChangeDialogOpen] = useState(false)
  const activeRequestRef = useRef<ActiveRequest | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [messages, sending])

  useEffect(
    () => () => {
      activeRequestRef.current?.controller.abort()
    },
    [],
  )

  function abortActiveRequest() {
    activeRequestRef.current?.controller.abort()
    activeRequestRef.current = null
    setSending(false)
  }

  function projectForContext(context: string) {
    return projects.find((project) => project.id === context)
  }

  function resetConversation(context = selectedContext) {
    abortActiveRequest()
    setMessages([createWelcome(projectForContext(context))])
    setDraft('')
    setActiveModel(null)
  }

  function applyContextChange(nextContext: string) {
    setSelectedContext(nextContext)
    resetConversation(nextContext)
  }

  function requestContextChange(nextContext: string) {
    if (nextContext === selectedContext || nextContext === NO_PROJECTS) return

    const hasConversation =
      sending || messages.some((message) => message.id !== 'welcome')
    if (hasConversation) {
      setPendingContext(nextContext)
      setChangeDialogOpen(true)
      return
    }

    applyContextChange(nextContext)
  }

  function confirmContextChange() {
    if (pendingContext) applyContextChange(pendingContext)
    setPendingContext(null)
    setChangeDialogOpen(false)
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault()
    const content = draft.trim()
    if (!content || sending) return

    const userMessage: UiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    }
    const nextMessages = [...messages, userMessage]
    const controller = new AbortController()
    const requestId = crypto.randomUUID()
    activeRequestRef.current = { id: requestId, controller }
    setMessages(nextMessages)
    setDraft('')
    setSending(true)

    try {
      const response = await api.chat(
        {
          projectId:
            selectedContext === GENERAL_CONTEXT ? undefined : selectedContext,
          messages: nextMessages
            .slice(-24)
            .map(({ role, content: messageContent }) => ({
              role,
              content: messageContent,
            })),
        },
        controller.signal,
      )
      if (
        controller.signal.aborted ||
        activeRequestRef.current?.id !== requestId
      ) {
        return
      }

      setActiveModel(response.model)
      setMessages((current) => [
        ...current,
        {
          ...response.message,
          id: crypto.randomUUID(),
          context: response.context,
          suggestedNextAction: response.suggestedNextAction,
        },
      ])
    } catch (error) {
      if (
        controller.signal.aborted ||
        (error instanceof Error && error.name === 'AbortError') ||
        activeRequestRef.current?.id !== requestId
      ) {
        return
      }

      toast.error('O Context Project não conseguiu responder', {
        description:
          error instanceof Error ? error.message : 'Tente novamente em instantes.',
      })
    } finally {
      if (activeRequestRef.current?.id === requestId) {
        activeRequestRef.current = null
        setSending(false)
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  const pendingProject = pendingContext
    ? projectForContext(pendingContext)
    : undefined
  const pendingContextName =
    pendingContext === GENERAL_CONTEXT
      ? 'Conversa geral'
      : pendingProject?.name ?? 'outro projeto'

  return (
    <div className="flex h-[calc(100svh-2rem)] min-h-[36rem] flex-col px-6 py-6">
      <header className="mx-auto mb-4 w-full max-w-4xl space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                Context Project
              </h1>
              <Badge variant="secondary">
                {activeModel === 'moonshotai.kimi-k2.5'
                  ? 'Kimi K2.5'
                  : activeModel ?? 'Modelo conectado'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedProject
                ? 'Contexto do GitHub atualizado a cada mensagem'
                : 'Conversa geral sem leitura de repositório'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {projectsQuery.isLoading ? (
              <div role="status" aria-label="Carregando projetos">
                <Skeleton className="h-8 w-56" />
                <span className="sr-only">Carregando projetos…</span>
              </div>
            ) : (
              <Select
                value={selectedContext}
                onValueChange={requestContextChange}
              >
                <SelectTrigger
                  size="sm"
                  className="w-56"
                  aria-label="Contexto da conversa"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectItem value={GENERAL_CONTEXT}>
                    Conversa geral
                  </SelectItem>
                  {projects.length > 0 ? (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={NO_PROJECTS} disabled>
                      {IS_CLOUD
                        ? 'Nenhum projeto GitHub'
                        : 'Nenhum projeto disponível'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => resetConversation()}
              disabled={!sending && messages.length === 1}
            >
              Limpar conversa
            </Button>
          </div>
        </div>

        {projectsQuery.isError && (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Projetos indisponíveis</AlertTitle>
            <AlertDescription>
              {projectsQuery.error instanceof Error
                ? projectsQuery.error.message
                : 'Não foi possível carregar a lista de projetos.'}
            </AlertDescription>
          </Alert>
        )}
      </header>

      <section
        className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-xl border bg-card"
        aria-label="Conversa com o Context Project"
      >
        <div
          className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6"
          aria-live="polite"
        >
          {messages.map((message) => {
            const assistant = message.role === 'assistant'
            const contextProject = message.context
              ? projectsQuery.data?.find(
                  (project) => project.id === message.context?.projectId,
                )
              : undefined

            return (
              <article
                key={message.id}
                className={cn('flex gap-3', !assistant && 'flex-row-reverse')}
              >
                <div
                  className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border',
                    assistant
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                  aria-hidden="true"
                >
                  {assistant ? (
                    <Bot className="size-4" />
                  ) : (
                    <User className="size-4" />
                  )}
                </div>
                <div className="max-w-[min(85%,42rem)]">
                  <div
                    className={cn(
                      'whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-relaxed',
                      assistant
                        ? 'border bg-background'
                        : 'bg-primary text-primary-foreground',
                    )}
                  >
                    {message.content}
                  </div>
                  {assistant && message.context && (
                    <ContextDetails context={message.context} />
                  )}
                  {assistant &&
                    message.context &&
                    message.suggestedNextAction && (
                      <SuggestedActionCard
                        projectId={message.context.projectId}
                        suggestion={message.suggestedNextAction}
                        currentNextAction={contextProject?.nextAction}
                      />
                    )}
                </div>
              </article>
            )
          })}

          {sending && (
            <div className="flex gap-3" role="status">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-primary text-primary-foreground">
                <Bot className="size-4" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-3 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                Kimi está pensando…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={sendMessage}
          className="border-t bg-background/80 p-3 backdrop-blur-sm sm:p-4"
        >
          <div className="relative">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedProject
                  ? `Pergunte sobre ${selectedProject.name}…`
                  : 'Pergunte alguma coisa…'
              }
              aria-label="Mensagem para o Context Project"
              maxLength={4_000}
              rows={3}
              disabled={sending}
              className="min-h-20 resize-none pr-14"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 bottom-2"
              disabled={!draft.trim() || sending}
              aria-label="Enviar mensagem"
            >
              {sending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MessageSquareText className="size-3" aria-hidden="true" />
              A conversa fica apenas nesta sessão.
            </span>
            <span>
              <kbd className="font-mono">Enter</kbd> envia ·{' '}
              <kbd className="font-mono">Shift+Enter</kbd> quebra linha
            </span>
          </div>
        </form>
      </section>

      <AlertDialog
        open={changeDialogOpen}
        onOpenChange={(open) => {
          setChangeDialogOpen(open)
          if (!open) setPendingContext(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar o contexto da conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              A conversa atual será limpa e qualquer resposta em andamento será
              cancelada. O novo contexto será “{pendingContextName}”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter conversa</AlertDialogCancel>
            <AlertDialogAction onClick={confirmContextChange}>
              Trocar e limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
