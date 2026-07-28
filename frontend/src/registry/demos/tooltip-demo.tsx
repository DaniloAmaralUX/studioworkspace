import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function TooltipDemo() {
  return (
    // O Tooltip exige um Provider por perto — envolva a árvore da aplicação
    // uma vez, ou o trecho onde os tooltips vivem.
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Abrir no Explorer">
            <FolderOpen className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Abrir no Explorer</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
