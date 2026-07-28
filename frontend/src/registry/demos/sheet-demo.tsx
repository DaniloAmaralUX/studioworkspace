import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

export default function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Editar próxima ação</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Próxima ação</SheetTitle>
          <SheetDescription>
            Uma frase curta e concreta — o que destrava o projeto agora.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 px-4">
          <Label htmlFor="demo-sheet-action">Ação</Label>
          <Textarea
            id="demo-sheet-action"
            defaultValue="Publicar a galeria do design system."
          />
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Salvar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
