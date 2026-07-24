import { useEffect } from 'react'

// Título da aba/janela reflete o contexto atual (Vercel guidelines).
// Ex.: "Projetos · Studio", "Ouvidoria · Studio".
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · Studio` : 'Studio'
  }, [title])
}
