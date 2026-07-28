import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SelectDemo() {
  return (
    <div className="grid w-full max-w-xs gap-2">
      <Label htmlFor="demo-status">Status do projeto</Label>
      <Select defaultValue="building">
        <SelectTrigger id="demo-status">
          <SelectValue placeholder="Escolha um status" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Em movimento</SelectLabel>
            <SelectItem value="planning">Planejando</SelectItem>
            <SelectItem value="building">Construindo</SelectItem>
            <SelectItem value="review">Em revisão</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Parado</SelectLabel>
            <SelectItem value="blocked">Bloqueado</SelectItem>
            <SelectItem value="done">Concluído</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
