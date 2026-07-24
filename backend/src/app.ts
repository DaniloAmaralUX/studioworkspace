import Fastify, { type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { FRONTEND_ORIGIN } from './config'
import { healthRoutes } from './routes/health'
import { projectRoutes } from './routes/projects'
import { openRoutes } from './routes/open'
import { githubRoutes } from './routes/github'
import { foundationRoutes } from './routes/foundation'
import { aiRoutes } from './routes/ai'
import { stampRoutes } from './routes/stamp'
import { scaffoldRoutes } from './routes/scaffold'
import { canvasRoutes } from './routes/canvas'

/** Monta o app completo sem dar listen — usado pelo server e pelos testes (inject). */
export async function buildApp({ logger = true }: { logger?: boolean } = {}) {
  const app = Fastify({ logger }).withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // Envelope único { error: { code, message } } para validação de schema e
  // imprevistos; erros de domínio continuam respondidos rota a rota.
  app.setErrorHandler((err: FastifyError, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      const where = err.validationContext ?? 'body'
      return reply
        .code(400)
        .send({ error: { code: `invalid_${where}`, message: err.message } })
    }
    const status = err.statusCode ?? 500
    if (status >= 500) {
      req.log.error({ err }, 'erro não tratado')
      return reply
        .code(500)
        .send({ error: { code: 'internal', message: 'Erro interno do Workspace Service.' } })
    }
    return reply
      .code(status)
      .send({ error: { code: err.code ?? 'bad_request', message: err.message } })
  })

  // Só a origem do frontend local pode falar com a API.
  await app.register(cors, { origin: FRONTEND_ORIGIN })
  // WebSocket (Modo Maestri) — registrar antes das rotas que usam { websocket: true }.
  await app.register(websocket)

  await app.register(healthRoutes)
  await app.register(projectRoutes)
  await app.register(openRoutes)
  await app.register(githubRoutes)
  await app.register(foundationRoutes)
  await app.register(aiRoutes)
  await app.register(stampRoutes)
  await app.register(scaffoldRoutes)
  await app.register(canvasRoutes)

  return app
}
