import { createContext } from 'react'

// Serviços do canvas que os nós custom consomem (React Flow não passa isso por props).
export interface CanvasCtx {
  projectId: string
  removeNode: (id: string) => void
  patchNodeData: (id: string, patch: Record<string, unknown>) => void
}

export const CanvasContext = createContext<CanvasCtx>({
  projectId: '',
  removeNode: () => {},
  patchNodeData: () => {},
})
