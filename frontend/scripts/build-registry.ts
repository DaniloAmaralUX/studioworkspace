// Gera registry.json (schema shadcn) a partir dos presets de tema.
// Rodar da pasta frontend/: npm run registry:build
// Depois o `shadcn build` compila cada item para public/r/<nome>.json,
// servido estático pelo mesmo deploy do hub (Vercel) e pelo Vite em dev.
import { writeFile } from 'node:fs/promises'
import { themePresets } from '../src/lib/themePresets.ts'

const HOMEPAGE = 'https://studioworkspace-mauve.vercel.app'

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'studio',
  homepage: HOMEPAGE,
  items: themePresets.map((p) => ({
    name: p.name,
    type: 'registry:theme',
    title: p.label,
    description: `Tema ${p.label} da biblioteca do Studio — tokens oklch light + dark (origem: tweakcn, Apache-2.0).`,
    cssVars: { light: p.light, dark: p.dark },
  })),
}

const out = new URL('../registry.json', import.meta.url)
await writeFile(out, JSON.stringify(registry, null, 2) + '\n')
console.log(`registry.json gerado: ${registry.items.length} temas`)
