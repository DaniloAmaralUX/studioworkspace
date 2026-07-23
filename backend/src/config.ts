import path from 'node:path'
import os from 'node:os'

export const PORT = Number(process.env.PORT ?? 5178)
export const HOST = '127.0.0.1'
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://127.0.0.1:5177'

const appData = process.env.APPDATA ?? path.join(os.homedir(), '.config')
export const DATA_DIR = process.env.PS_DATA_DIR ?? path.join(appData, 'project-studio')
export const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json')

// Destino de clones sob demanda de repositórios do GitHub (Fatia 3).
export const WORK_DIR =
  process.env.PS_WORK_DIR ?? path.resolve(process.cwd(), '..', 'work')
