import { TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function AlertDemo() {
  return (
    <div className="grid w-full max-w-md gap-3">
      <Alert>
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>Contexto parcial</AlertTitle>
        <AlertDescription>
          Não foi possível consultar as issues abertas — verifique as permissões
          do token.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>Falha ao salvar</AlertTitle>
        <AlertDescription>
          Tente novamente em alguns instantes.
        </AlertDescription>
      </Alert>
    </div>
  )
}
