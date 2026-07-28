import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>Salvar</Button>
      <Button variant="secondary">Secundário</Button>
      <Button variant="outline">Contorno</Button>
      <Button variant="ghost">Discreto</Button>
      <Button variant="destructive">Remover</Button>
      <Button size="sm">
        Abrir
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Button>
      <Button disabled>Desabilitado</Button>
    </div>
  )
}
