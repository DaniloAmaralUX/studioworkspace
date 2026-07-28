import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TabsDemo() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-sm">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="engineering">Engineering</TabsTrigger>
        <TabsTrigger value="design">Design</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-sm text-muted-foreground">
        Próxima ação, abridores e estado do projeto.
      </TabsContent>
      <TabsContent
        value="engineering"
        className="text-sm text-muted-foreground"
      >
        Issues abertas, pull requests e execuções de CI.
      </TabsContent>
      <TabsContent value="design" className="text-sm text-muted-foreground">
        Foundation, tema aplicado e tokens do projeto.
      </TabsContent>
    </Tabs>
  )
}
