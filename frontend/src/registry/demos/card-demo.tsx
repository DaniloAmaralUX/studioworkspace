import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function CardDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Project Studio</CardTitle>
        <CardDescription>
          Hub de projetos com a próxima ação sempre visível.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">Construindo</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Próxima ação: publicar a galeria do design system.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Abrir projeto</Button>
      </CardFooter>
    </Card>
  )
}
