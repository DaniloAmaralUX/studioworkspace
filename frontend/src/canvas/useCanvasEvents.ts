import { useEffect } from 'react'
import { WS_BASE } from '@/lib/api'

// Assina o WS de eventos do canvas e dispara onNoteChanged quando um .md muda
// no disco (agente editou pelo CLI). Reconecta ao trocar de projeto.
export function useCanvasEvents(
  projectId: string,
  onNoteChanged: (noteId: string) => void,
): void {
  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      ws = new WebSocket(`${WS_BASE}/projects/${projectId}/canvas/events`)
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as {
            type?: string
            noteId?: string
          }
          if (msg.type === 'note-changed' && msg.noteId) onNoteChanged(msg.noteId)
        } catch {
          /* frame inválido — ignora */
        }
      }
    } catch {
      /* WS indisponível — canvas segue funcionando sem live update */
    }
    return () => {
      try {
        ws?.close()
      } catch {
        /* já fechado */
      }
    }
  }, [projectId, onNoteChanged])
}
