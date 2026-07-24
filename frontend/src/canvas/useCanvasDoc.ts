import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react'
import { api } from '@/lib/api'
import type {
  CanvasDoc,
  CanvasEdge,
  CanvasNode,
  CanvasNodeData,
  CanvasNodeKind,
} from '@/lib/types'

export type SaveState = 'idle' | 'saving' | 'saved'

function toNode(cn: CanvasNode): Node {
  return {
    id: cn.id,
    type: cn.kind,
    position: cn.position,
    data: cn.data as unknown as Record<string, unknown>,
    ...(cn.width ? { width: cn.width } : {}),
    ...(cn.height ? { height: cn.height } : {}),
    ...(cn.parentId ? { parentId: cn.parentId } : {}),
  }
}
function fromNode(n: Node): CanvasNode {
  return {
    id: n.id,
    kind: (n.type ?? 'text') as CanvasNodeKind,
    position: n.position,
    width: n.width,
    height: n.height,
    parentId: n.parentId,
    data: n.data as unknown as CanvasNodeData,
  }
}
function toEdge(e: CanvasEdge): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    data: { mode: e.mode, prefix: e.prefix },
    animated: e.mode === 'auto',
  }
}
function fromEdge(e: Edge): CanvasEdge {
  const data = (e.data ?? {}) as { mode?: 'manual' | 'auto'; prefix?: string }
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    mode: data.mode ?? 'manual',
    prefix: data.prefix,
  }
}

/** Carrega o doc do projeto, mantém nodes/edges e autossalva (debounce 800ms). */
export function useCanvasDoc(projectId: string) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [loaded, setLoaded] = useState(false)
  const [save, setSave] = useState<SaveState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNext = useRef(true) // não salvar logo após carregar

  useEffect(() => {
    let alive = true
    void api.getCanvas(projectId).then((doc) => {
      if (!alive) return
      setNodes(doc.nodes.map(toNode))
      setEdges(doc.edges.map(toEdge))
      skipNext.current = true
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [projectId, setNodes, setEdges])

  useEffect(() => {
    if (!loaded) return
    if (skipNext.current) {
      skipNext.current = false
      return
    }
    setSave('saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const doc: CanvasDoc = {
        version: 1,
        floorId: 'main',
        nodes: nodes.map(fromNode),
        edges: edges.map(fromEdge),
        viewport: { x: 0, y: 0, zoom: 1 },
        routines: [],
        updatedAt: '',
      }
      void api
        .putCanvas(projectId, doc)
        .then(() => setSave('saved'))
        .catch(() => setSave('idle'))
    }, 800)
  }, [nodes, edges, loaded, projectId])

  const addNode = useCallback(
    (node: Node) => setNodes((ns) => [...ns, node]),
    [setNodes],
  )
  const patchNodeData = useCallback(
    (id: string, patch: Record<string, unknown>) =>
      setNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
      ),
    [setNodes],
  )
  const removeNode = useCallback(
    (id: string) => setNodes((ns) => ns.filter((n) => n.id !== id)),
    [setNodes],
  )

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    addNode,
    patchNodeData,
    removeNode,
    save,
    loaded,
  }
}
