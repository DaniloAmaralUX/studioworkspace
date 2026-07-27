// Entry usado pelo app Electron: sobe o Fastify (com o frontend estático) e
// devolve um handle para fechar. Empacotado num único .cjs pelo esbuild.
import './env'
import { buildApp } from './app'

export async function startServer(opts: {
  port: number
  host: string
  staticDir: string
}): Promise<{ close: () => Promise<void> }> {
  const app = await buildApp({ logger: false, serveStatic: opts.staticDir })
  await app.listen({ host: opts.host, port: opts.port })
  return { close: () => app.close() }
}
