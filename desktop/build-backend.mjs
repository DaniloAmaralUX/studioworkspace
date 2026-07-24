// Empacota o backend Fastify num único CJS que o Electron main carrega.
// Nativos e opcionais ficam external (não são importados pelo código-fonte).
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))

await build({
  entryPoints: [path.join(dir, '..', 'backend', 'src', 'appBundle.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
  outfile: path.join(dir, 'dist', 'backend.cjs'),
  external: ['electron', 'bufferutil', 'utf-8-validate', '@lydell/node-pty'],
  logLevel: 'info',
})

console.log('✓ backend empacotado em dist/backend.cjs')
