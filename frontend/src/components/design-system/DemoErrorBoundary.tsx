import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

/**
 * Isola cada demo: um componente quebrado vira um aviso no próprio card, nunca
 * uma página branca. Precisa ser class component — React não expõe error
 * boundary em hooks.
 */
export class DemoErrorBoundary extends Component<
  { title: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Demo "${this.props.title}" falhou:`, error, info)
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TriangleAlert
            className="size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          Falha ao renderizar o exemplo de {this.props.title}.
        </div>
      )
    }
    return this.props.children
  }
}
