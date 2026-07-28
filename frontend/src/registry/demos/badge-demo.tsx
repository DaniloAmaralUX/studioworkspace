import { Badge } from '@/components/ui/badge'

export default function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Padrão</Badge>
      <Badge variant="secondary">Secundário</Badge>
      <Badge variant="outline">Contorno</Badge>
      <Badge variant="destructive">Bloqueado</Badge>
      <Badge variant="secondary" className="font-mono text-[10px]">
        v0.1.0
      </Badge>
    </div>
  )
}
