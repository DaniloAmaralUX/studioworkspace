import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Bot, LoaderCircle, MessageSquareText, Send, User } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api, type ChatMessage } from '@/lib/api'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { cn } from '@/lib/utils'

type UiMessage = ChatMessage & { id: string }

const WELCOME: UiMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Olá! Sou o Context Project. Nesta primeira versão já podemos conversar e testar perguntas básicas. A leitura do GitHub entra na próxima etapa.',
}

export function ChatScreen() {
  useDocumentTitle('Context Project')
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [messages, sending])

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
    setMessages(nextMessages)
    setDraft('')
    setSending(true)

    try {
      const response = await api.chat(
        nextMessages
          .slice(-24)
          .map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
      )
      setActiveModel(response.model)
      setMessages((current) => [
        ...current,
        { ...response.message, id: crypto.randomUUID() },
      ])
    } catch (error) {
      toast.error('O Context Project não conseguiu responder', {
        description: (error as Error).message,
      })
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div className="flex h-[calc(100svh-2rem)] min-h-[36rem] flex-col px-6 py-6">
      <header className="mx-auto mb-4 flex w-full max-w-4xl items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
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
            Converse agora · contexto do GitHub na próxima fatia
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setMessages([WELCOME])}
          disabled={sending || messages.length === 1}
        >
          Limpar conversa
        </Button>
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
            return (
              <article
                key={message.id}
                className={cn(
                  'flex gap-3',
                  !assistant && 'flex-row-reverse',
                )}
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
                <div
                  className={cn(
                    'max-w-[min(85%,42rem)] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-relaxed',
                    assistant
                      ? 'border bg-background'
                      : 'bg-primary text-primary-foreground',
                  )}
                >
                  {message.content}
                </div>
              </article>
            )
          })}

          {sending && (
            <div className="flex gap-3" role="status">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-primary text-primary-foreground">
                <Bot className="size-4" />
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-3 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
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
              placeholder="Pergunte alguma coisa…"
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
              <MessageSquareText className="size-3" />
              A conversa fica apenas nesta sessão.
            </span>
            <span>
              <kbd className="font-mono">Enter</kbd> envia ·{' '}
              <kbd className="font-mono">Shift+Enter</kbd> quebra linha
            </span>
          </div>
        </form>
      </section>
    </div>
  )
}
