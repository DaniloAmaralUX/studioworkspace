import './env'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { HOST, PORT, FRONTEND_ORIGIN } from './config'
import { healthRoutes } from './routes/health'
import { projectRoutes } from './routes/projects'
import { openRoutes } from './routes/open'
import { githubRoutes } from './routes/github'
import { foundationRoutes } from './routes/foundation'
import { aiRoutes } from './routes/ai'
import { stampRoutes } from './routes/stamp'
import { scaffoldRoutes } from './routes/scaffold'

const app = Fastify({ logger: true })

// Só a origem do frontend local pode falar com a API.
await app.register(cors, { origin: FRONTEND_ORIGIN })

await app.register(healthRoutes)
await app.register(projectRoutes)
await app.register(openRoutes)
await app.register(githubRoutes)
await app.register(foundationRoutes)
await app.register(aiRoutes)
await app.register(stampRoutes)
await app.register(scaffoldRoutes)

try {
  await app.listen({ host: HOST, port: PORT })
  app.log.info(`Workspace Service em http://${HOST}:${PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
