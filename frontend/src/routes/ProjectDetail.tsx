import { useParams } from 'react-router-dom'

export function ProjectDetail() {
  const { id } = useParams()
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Detalhe do projeto</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        As abas Overview / Engineering / Design chegam na R4. (id: {id})
      </p>
    </div>
  )
}
