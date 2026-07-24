import './env'
import { HOST, PORT } from './config'
import { buildApp } from './app'

const app = await buildApp()

try {
  await app.listen({ host: HOST, port: PORT })
  app.log.info(`Workspace Service em http://${HOST}:${PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
