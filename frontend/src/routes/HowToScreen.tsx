import type { ComponentType, ReactNode } from 'react'
import {
  FolderKanban,
  Monitor,
  Cloud,
  PackageCheck,
  Palette,
  Plus,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { GithubIcon } from '@/components/GithubIcon'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

/** Chip que marca onde o recurso funciona: desktop, nuvem ou ambos. */
function Where({ kind }: { kind: 'desktop' | 'nuvem' | 'ambos' }) {
  const label =
    kind === 'desktop' ? 'Desktop' : kind === 'nuvem' ? 'Nuvem' : 'Ambos'
  const Icon = kind === 'desktop' ? Monitor : kind === 'nuvem' ? Cloud : null
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {Icon && <Icon className="size-3" />}
      {label}
    </span>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
      {children}
    </kbd>
  )
}

function Cmd({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[12px]">
      {children}
    </code>
  )
}

function Step({
  n,
  icon: Icon,
  title,
  where,
  children,
}: {
  n: number
  icon: ComponentType<{ className?: string }>
  title: string
  where: 'desktop' | 'nuvem' | 'ambos'
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center gap-3">
        <span className="tnum flex size-7 shrink-0 items-center justify-center rounded-lg border bg-muted/50 font-mono text-xs font-semibold">
          {String(n).padStart(2, '0')}
        </span>
        <Icon className="size-4 shrink-0 text-primary" />
        <h2 className="flex-1 text-sm font-semibold tracking-tight">{title}</h2>
        <Where kind={where} />
      </div>
      <div className="space-y-2 pl-10 text-[13px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

export function HowToScreen() {
  useDocumentTitle('Como usar')
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Como usar</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          O Studio organiza seus projetos e opera seu design system — no
          desktop e na nuvem. O essencial em 7 passos.
        </p>
      </header>

      <div className="space-y-3">
        <Step n={1} icon={Terminal} title="Abrir a ferramenta" where="ambos">
          <p>
            <strong className="text-foreground">No computador:</strong> digite{' '}
            <Cmd>studio</Cmd> em qualquer terminal — sobe tudo e abre o
            navegador sozinho.
          </p>
          <p>
            <strong className="text-foreground">De qualquer lugar:</strong>{' '}
            acesse <Cmd>studioworkspace-mauve.vercel.app</Cmd>. É o mesmo hub,
            com seus projetos persistidos na nuvem.
          </p>
        </Step>

        <Step n={2} icon={FolderKanban} title="Ver e organizar" where="ambos">
          <p>
            A tela <strong className="text-foreground">Projetos</strong> lista
            tudo com status e a{' '}
            <strong className="text-foreground">próxima ação</strong> sempre
            visível — você abre e sabe onde parou. <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>{' '}
            busca em tudo.
          </p>
        </Step>

        <Step n={3} icon={Plus} title="Adicionar ou criar projeto" where="ambos">
          <p>
            <strong className="text-foreground">+ Projeto</strong> → aba{' '}
            <strong className="text-foreground">GitHub</strong> lista seus
            repositórios (um clique e entra com metadados).
          </p>
          <p>
            No desktop há ainda{' '}
            <strong className="text-foreground">Criar</strong>: gera uma pasta
            nova já no seu padrão — <Cmd>git init</Cmd>, template opcional,
            registry e regras de design carimbados. E{' '}
            <strong className="text-foreground">Pasta local</strong> associa o
            que já existe (nada é copiado).
          </p>
        </Step>

        <Step n={4} icon={Sparkles} title="Sugerir com IA" where="ambos">
          <p>
            No detalhe do projeto, o botão{' '}
            <strong className="text-foreground">Sugerir com IA</strong> lê o
            README e os commits recentes e propõe{' '}
            <strong className="text-foreground">uma</strong> próxima ação,
            concreta e curta. Edite à vontade — salva sozinho.
          </p>
        </Step>

        <Step
          n={5}
          icon={PackageCheck}
          title="Preparar para qualquer IDE"
          where="desktop"
        >
          <p>
            Em <strong className="text-foreground">Portabilidade</strong>, um
            clique escreve suas regras de design + config do shadcn MCP dentro
            do projeto (<Cmd>AGENTS.md</Cmd>, <Cmd>CLAUDE.md</Cmd>, Cursor,
            Copilot, VS Code). Abra em qualquer IDE: a IA já conhece seu design
            system. Ao usar <strong className="text-foreground">Abrir →
            Claude/Code/Cursor</strong>, isso acontece automaticamente.
          </p>
        </Step>

        <Step n={6} icon={Palette} title="Trocar de tema" where="ambos">
          <p>
            Em <strong className="text-foreground">Temas</strong>, 36 presets
            estilo tweakcn — clique e o app inteiro muda na hora.{' '}
            <strong className="text-foreground">Tema padrão</strong> reseta; o
            comando <Cmd>shadcn apply</Cmd> exibido aplica o tema em outro
            projeto seu.
          </p>
        </Step>

        <Step n={7} icon={GithubIcon} title="O princípio de tudo" where="ambos">
          <p>
            Sua memória de design mora em{' '}
            <strong className="text-foreground">
              arquivos que são seus, dentro do git
            </strong>{' '}
            — nunca numa conta. Trocar de IDE, de máquina ou de login não te
            tira nada: o contexto viaja com o projeto.
          </p>
        </Step>
      </div>

      <p className="tnum mt-6 text-center text-[11px] text-muted-foreground/60">
        Studio · workspace de design engineer · desktop 127.0.0.1 · nuvem
        Vercel
      </p>
    </div>
  )
}
