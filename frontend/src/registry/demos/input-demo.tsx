import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function InputDemo() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor="demo-repo">Repositório</Label>
        <Input id="demo-repo" placeholder="owner/projeto" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="demo-disabled">Somente leitura</Label>
        <Input id="demo-disabled" defaultValue="studioworkspace" disabled />
      </div>
    </div>
  )
}
