import type { FastifyInstance } from 'fastify'
import { FRONTEND_ORIGIN } from '../config'

// Rotas do "Modo Maestri" (canvas de orquestração) — desktop-only.
// M0: só um echo WebSocket, para provar o transporte ponta a ponta (browser →
// Fastify 5178). WS não passa por CORS do browser, então validamos a origem no
// handshake. As rotas de terminal/PTY entram nas próximas fatias.
export async function canvasRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/canvas/ws-echo', { websocket: true }, (socket, req) => {
    // Sem origin (testes via injectWS) passa; browser precisa bater a origem.
    const origin = req.headers.origin
    if (origin && origin !== FRONTEND_ORIGIN) {
      socket.close(1008, 'origem não autorizada')
      return
    }
    socket.on('message', (data: Buffer) => {
      socket.send(data.toString())
    })
  })
}
