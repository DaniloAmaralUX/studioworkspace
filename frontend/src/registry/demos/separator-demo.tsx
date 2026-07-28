import { Separator } from '@/components/ui/separator'

export default function SeparatorDemo() {
  return (
    <div className="w-full max-w-sm">
      <div>
        <h4 className="text-sm font-medium">Studio</h4>
        <p className="text-sm text-muted-foreground">
          Hub de projetos local e na nuvem.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4 text-sm">
        <span>Projetos</span>
        <Separator orientation="vertical" />
        <span>Temas</span>
        <Separator orientation="vertical" />
        <span>Skills</span>
      </div>
    </div>
  )
}
