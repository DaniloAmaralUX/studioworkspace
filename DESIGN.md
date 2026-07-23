# DESIGN.md — Project Studio

Memória de design + especificação de telas e fluxos. Inspiração direta de UX: **`shadcn/create`**
(https://ui.shadcn.com/create) — poucas decisões importantes, apresentadas visualmente, com preview real.

Este arquivo é a **fonte de verdade de design** do produto. Toda tela nova deve ser coerente com os
princípios e tokens abaixo.

---

## 1. Princípios de design (TDAH-aware)

1. **Próxima ação sempre visível.** Em todo card e tela, a próxima coisa a fazer está à mostra e editável.
2. **Uma decisão por vez.** Poucas opções, agrupadas; defaults recomendados; linguagem direta.
3. **Achar em segundos.** Busca sempre acessível (`Ctrl+K` / `/`); filtros simples; ordenar por "mexi por último".
4. **Mostrar antes de agir.** Abrir/clonar mostram o que vai acontecer; confirmar o que é destrutivo.
5. **Sem ruído.** Nada de métrica decorativa. Cada elemento na tela ganha o seu espaço.
6. **Feedback imediato.** Optimistic UI + toasts curtos; estados de vazio/carregando/erro sempre desenhados.

---

## 2. Foundation do próprio Project Studio (o app usa shadcn)

> Este é o "resultado" que o configurador do produto geraria para o próprio app — serve de exemplo vivo.

- **Biblioteca:** shadcn/ui (Radix) + Tailwind, CSS variables, tema claro/escuro seguindo o SO.
- **Base color:** `zinc` (neutra). **Accent primário:** um azul sóbrio para ações (`--primary`).
- **Cores semânticas:** `success` (verde), `warning` (âmbar), `danger` (vermelho), `muted` (cinza).
- **Tipografia:** UI sans (ex. Inter / system-ui); números tabulares em datas/contadores.
- **Radius:** `0.625rem` (cantos suaves, mas não redondos demais).
- **Densidade:** confortável por padrão (linhas e paddings generosos).
- **Ícones:** `lucide-react`. Local = ícone de pasta; GitHub = ícone do GitHub.

### Mapa de status → cor (badges)
| Status | Cor | Rótulo |
|---|---|---|
| `planning` | cinza/azul | Planejando |
| `building` | azul | Construindo |
| `review` | âmbar | Revisão |
| `blocked` | vermelho | Bloqueado |
| `done` | verde | Concluído |

### Saúde/atividade
- "Última atividade" em linguagem humana: **"há 3 dias"**, **"ontem"**, **"agora"**.
- Projeto cuja pasta sumiu → estado **bloqueado** com aviso e ação sugerida ("religar caminho").

---

## 3. Layout global

```
┌───────────────────────────────────────────────────────────────┐
│  Topbar:  Project Studio        [ 🔍 buscar (Ctrl+K) ]  [+ Projeto] │
├───────────────────────────────────────────────────────────────┤
│  Filtros:  [Todos ▾] [Tags ▾] [Stack ▾] [Fonte: Local·GitHub] [Ordenar ▾] │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│   grid responsivo de ProjectCards (1–4 colunas)               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

Sem sidebar pesada no MVP. Tudo gira em torno do grid + toolbar. O configurador de foundation é uma
tela/rota à parte, aberta a partir de um projeto.

---

## 4. Tela: Hub (Home)

**Objetivo:** ver todos os projetos e entrar no certo rápido.

### ProjectCard (o coração do produto)
```
┌─────────────────────────────────────────────┐
│ 📁  nome-do-projeto            [● Construindo]│  ← nome + StatusBadge
│ github: owner/repo · TS · Next · Tailwind     │  ← SourceBadge + stack (badges)
│ ─────────────────────────────────────────────│
│ Próxima ação:                                 │
│ [ escrever landing e conectar API ______ ✎ ] │  ← NextActionInput (edição inline, auto-save)
│ ─────────────────────────────────────────────│
│ há 3 dias · #cliente #wip        [ Abrir ▾ ]  │  ← última atividade + tags + OpenWithMenu
└─────────────────────────────────────────────┘
```

- **NextActionInput:** clique = já edita (sem "modo edição"); salva no blur/debounce; mostra "salvo".
- **OpenWithMenu:** dropdown só com abridores disponíveis (Explorer, Terminal, Claude Code Desktop; VS
  Code/Cursor se houver). Item padrão destacado. Se GitHub sem clone, o item mostra "clonar e abrir".
- Menu "…": editar tags, mudar status, renomear, remover do hub (confirma; não apaga a pasta).

### Estados
- **Empty:** ilustração simples + "Adicione sua primeira pasta ou repositório" + botão.
- **Loading:** 6 skeleton cards.
- **Error/backend offline:** faixa "Workspace Service não está rodando" + como subir (`start-workspace.ps1`) + retry.

### Busca e filtros
- Busca textual (nome, tag, owner/repo, stack). `Ctrl+K` foca.
- Filtros: por tag, por stack, por fonte (Local/GitHub). Ordenar: última atividade (padrão), nome, status.

---

## 5. Tela/Fluxo: Adicionar projeto

Dialog (ou Sheet) com **duas abas**:

### Aba "Pasta local"
1. Campo de caminho (colar ou botão "escolher…").
2. Backend valida existência, checa duplicata, detecta stack.
3. Prévia: nome sugerido + stack detectada. Confirmar → card aparece no hub.

### Aba "GitHub"
1. Lista buscável dos **meus repositórios** (via `gh repo list`): nome, descrição, linguagem, "atualizado
   há…", privado/público.
2. Selecionar um (ou vários). Confirmar → viram cards (metadados via `gh`, **sem clonar**).
3. Se `gh` não estiver logado: estado explicando `gh auth login` (o app não faz login).

---

## 6. Fluxo: Abrir / trabalhar

```
Abrir ▾ → escolhe ferramenta
   ├─ local            → abre direto (explorer / wt / claude:// / code)
   └─ github sem clone → confirma "clonar em WORK_DIR e abrir?" → gh repo clone → abre
```

- Toda abertura mostra feedback ("abrindo no Windows Terminal…").
- Clone mostra progresso simples e trata erro (repo privado sem acesso, etc.).

---

## 7. Tela: Configurador de Foundation (diferencial, estilo `shadcn/create`)

**Objetivo:** definir a fundação visual/técnica de um projeto com poucas decisões e **preview real**.

### Layout (3 colunas)
```
┌───────────────┬───────────────────────────────┬─────────────────┐
│ DECISÕES      │ PREVIEW (componentes reais)   │ RESUMO          │
│               │                               │                 │
│ Framework     │  ┌ sidebar ┬ topbar ────────┐ │ shadcn command: │
│ Linguagem     │  │         │ cards          │ │  npx shadcn ... │
│ Package mgr   │  │         │ formulário     │ │                 │
│ Component lib │  │         │ tabela         │ │ [Copiar]        │
│ Base color    │  │         │ dialog         │ │ [Salvar]        │
│ Tema (preset) │  │         │ estados: ok/erro/vazio │ [Aplicar ▾] │
│ Fonte / Títulos│ └─────────┴────────────────┘ │   • tudo        │
│ Radius        │                               │   • só tema     │
│ Densidade     │  (atualiza AO VIVO a cada     │   • só fontes   │
│ Ícones        │   mudança à esquerda)         │                 │
└───────────────┴───────────────────────────────┴─────────────────┘
```

- **Uma decisão por vez em destaque**, defaults recomendados marcados.
- **Preview real:** renderiza sidebar, topbar, cards, formulário, tabela, dialog e os estados
  sucesso/erro/vazio usando os tokens escolhidos — o usuário vê exatamente o layout.
- **Resumo (dir):** o comando `shadcn` gerado (copiável) + botões **Salvar** (`foundation.json`) e
  **Aplicar** com opções **tudo / só tema / só fontes** — sempre **mostrando o comando antes**.
- Ao salvar: grava `.workspace/foundation.json` e (re)gera `DESIGN.md` do projeto-alvo.

### Decisões e opções (MVP)
| Decisão | Opções (default em **negrito**) |
|---|---|
| Framework | **Next**, Vite |
| Linguagem | **TypeScript** |
| Package manager | **npm** |
| Component library | **shadcn/ui** |
| Base color | **zinc**, slate, stone, neutral, gray |
| Tema (preset) | **Default**, + presets salvos |
| Fonte | **Inter**, Geist, system-ui, … |
| Radius | 0, 0.3, **0.5**, 0.625, 1rem |
| Densidade | compacta, **confortável**, espaçosa |
| Ícones | **lucide** |

---

## 8. Acessibilidade

- Contraste AA; foco visível; navegação por teclado em toda ação; alvos ≥ 40px.
- Cada estado de erro traz **ação sugerida**, não só a mensagem.
- Texto claro, sem jargão desnecessário; datas em linguagem humana.

---

## 9. Componentes shadcn usados

`button`, `card`, `input`, `badge`, `dialog`, `sheet`, `tabs`, `select`, `dropdown-menu`, `tooltip`,
`skeleton`, `scroll-area`, `separator`, `label`, `switch`, `sonner` (toasts). Ícones via `lucide-react`.
