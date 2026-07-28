import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function SonnerDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast('Próxima ação salva', {
            description: 'Publicar a galeria do design system.',
          })
        }
      >
        Notificação
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Não foi possível copiar', {
            description: 'Selecione o comando e copie manualmente.',
          })
        }
      >
        Erro
      </Button>
    </div>
  )
}
