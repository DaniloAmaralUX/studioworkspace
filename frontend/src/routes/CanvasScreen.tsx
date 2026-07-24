import { ReactFlow, Background, Controls, type Edge, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'

// M0: canvas vazio (React Flow) — só prova que o motor renderiza e a rota vive
// fora da cloud. Nós (terminais, notas…) entram nas próximas fatias.
const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export default function CanvasScreen() {
  const { id = '' } = useParams()
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.id === id)

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-4 py-2.5">
        <Link
          to={`/projects/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {project?.name ?? 'Projeto'}
        </Link>
        <span className="text-sm font-semibold tracking-tight">Canvas</span>
        <span className="ml-auto text-xs text-muted-foreground">
          Modo Maestri · orquestração de agentes
        </span>
      </header>
      <div className="flex-1">
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          fitView
          minZoom={0.25}
          maxZoom={2}
          snapGrid={[16, 16]}
          snapToGrid
          deleteKeyCode={null}
          onlyRenderVisibleElements
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
