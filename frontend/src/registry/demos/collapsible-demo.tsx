import { ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export default function CollapsibleDemo() {
  return (
    <Collapsible className="w-full max-w-sm rounded-lg border bg-muted/30 p-3">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-between px-2"
        >
          <span>3 fontes consultadas</span>
          <ChevronsUpDown aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-2 space-y-1 border-t pt-2 text-xs text-muted-foreground">
          <li className="px-2">owner/studioworkspace</li>
          <li className="px-2">README.md</li>
          <li className="px-2 font-mono tabular-nums">
            a1b2c3d · feat: galeria do design system
          </li>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
