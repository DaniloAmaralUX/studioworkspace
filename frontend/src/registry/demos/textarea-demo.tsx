import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function TextareaDemo() {
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="demo-textarea">Próxima ação</Label>
      <Textarea
        id="demo-textarea"
        placeholder="Qual é a próxima ação?"
        rows={3}
      />
      <p className="text-xs text-muted-foreground">
        Uma frase imperativa curta. É o que aparece no card do projeto.
      </p>
    </div>
  )
}
