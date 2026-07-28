// Dois mapas sobre os mesmos arquivos de demo, ambos NÃO-eager: o Vite gera um
// chunk por demo e um por fonte, então nada disso entra no bundle principal.
// Ligar `eager: true` aqui infla o index — é a armadilha a evitar.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

const modules = import.meta.glob('./demos/*-demo.tsx')
const sources = import.meta.glob('./demos/*-demo.tsx', {
  query: '?raw',
  import: 'default',
})

/** './demos/button-demo.tsx' → 'button' */
function nameFromPath(path: string): string {
  return path.replace('./demos/', '').replace('-demo.tsx', '')
}

export const demoComponents: Record<
  string,
  LazyExoticComponent<ComponentType>
> = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [
    nameFromPath(path),
    lazy(load as () => Promise<{ default: ComponentType }>),
  ]),
)

const sourceLoaders: Record<string, () => Promise<unknown>> =
  Object.fromEntries(
    Object.entries(sources).map(([path, load]) => [nameFromPath(path), load]),
  )

const sourceCache = new Map<string, string>()

export function hasDemo(name: string): boolean {
  return name in demoComponents
}

/** Carrega o fonte do demo só na primeira abertura da aba Código. */
export async function loadDemoSource(name: string): Promise<string | null> {
  const cached = sourceCache.get(name)
  if (cached !== undefined) return cached

  const load = sourceLoaders[name]
  if (!load) return null

  const source = String(await load())
  sourceCache.set(name, source)
  return source
}
