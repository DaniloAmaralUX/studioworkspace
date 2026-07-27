# Copilot — instruções do projeto

> Contexto de design mantido pelo Project Studio. O bloco abaixo é regenerável; edite livremente FORA dele.

<!-- STUDIO:BEGIN (gerado pelo Project Studio — edite fora deste bloco) -->
# Regras de Design — workspace Design Engineer

Este projeto segue um design system pessoal. Ao **gerar, revisar ou ajustar** qualquer UI, aplique estas regras automaticamente.

## Base
- **100% shadcn/ui** sobre Radix + Tailwind. Nunca use `<button>`/`<input>`/`<select>` nativos quando há primitivo shadcn.
- **Dark mode default.** Tokens semânticos (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`). Nunca cor hex hardcoded.
- Estilo `new-york`. **Um único accent** via `--color-primary`. Radius base `0.625rem`.
- Cada valor editável mostra o token correspondente (ex.: `spacing.4` = `16px`).

## Tipografia (obsessiva com detalhe)
- **Mono** para código/valores/tokens/timestamps, com **ligatures** (JetBrains Mono / SF Mono).
- **Sans** humanista para UI (Inter/Geist), com `optical sizing` quando a fonte suportar.
- **Números técnicos** (hex, px, rem, versões, commits): `font-variant-numeric: tabular-nums` **obrigatório**.
- Type scale em grid de **4px**. Smart punctuation. `line-clamp` para truncar (nunca overflow escondido sem estratégia).
- `font-feature-settings` configurado quando a fonte suportar.

## Interação (Apple-style)
- **Easing físico (spring)**, nunca `ease-in-out` genérico. Animar **só `transform` e `opacity`**.
- Transições **interrompíveis**. Feedback visual distinto em hover · active · focus · disabled.
- Materiais translúcidos (`backdrop-blur` + borda `1px` de baixa opacidade) em painéis flutuantes.
- Respeitar `prefers-reduced-motion`. Momentum em scroll/swipe/drag.
- Inputs numéricos com scrubber (click+drag, estilo Figma).

## Estados & anti-patterns
- Loading/empty/error **sempre** com componente shadcn (Skeleton/Empty/Alert), nunca texto solto.
- Estados vazios úteis: atalhos de teclado, templates — nunca ilustração genérica.
- **AlertDialog** para destrutivo. **Nunca** `Dialog` para confirmar, **nunca** `confirm()`/`alert()`/`prompt()` do browser.
- Acessibilidade: foco visível, navegação por teclado, leitores de tela.

## Componentes
- O **shadcn MCP** está configurado neste repo — use-o para descobrir e instalar componentes do registry em vez de escrever primitivos na mão.
<!-- STUDIO:END -->
