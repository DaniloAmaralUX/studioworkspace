import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LabelDemo() {
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="demo-next-action">Próxima ação</Label>
      <Input id="demo-next-action" placeholder="Qual é a próxima ação?" />
      <p className="text-xs text-muted-foreground">
        Clicar no rótulo move o foco para o campo — é a ligação acessível que o
        Label garante.
      </p>
    </div>
  )
}
