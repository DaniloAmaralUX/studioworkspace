// Import one-time (PLANO2.md, Fatia 1): lê o índice do desktop
// (%APPDATA%\project-studio\projects.json), filtra os projetos GitHub e grava
// no KV do Studio Cloud. Projetos `local` ficam de fora (são da variante desktop).
//
// Pré-requisito: `vercel env pull` feito em frontend/ (gera frontend/.env.local
// com as credenciais do Upstash). Nada de credencial é impresso ou versionado.
//
// Uso: node scripts/import-to-cloud.mjs [--dry-run]
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { Redis } from '@upstash/redis'

const dryRun = process.argv.includes('--dry-run')

function parseEnvFile(text) {
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.*?)"?\s*$/.exec(line)
    if (m) env[m[1]] = m[2]
  }
  return env
}

const envPath = path.resolve(import.meta.dirname, '..', 'frontend', '.env.local')
const env = parseEnvFile(await readFile(envPath, 'utf8').catch(() => ''))
const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL
const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN
if (!url || !token) {
  console.error(
    'Credenciais do KV não encontradas em frontend/.env.local — rode `vercel env pull` em frontend/ primeiro.',
  )
  process.exit(1)
}

const appData = process.env.APPDATA ?? path.join(os.homedir(), '.config')
const dataFile = path.join(appData, 'project-studio', 'projects.json')
const all = JSON.parse(await readFile(dataFile, 'utf8'))

const github = all.filter((p) => p.source?.kind === 'github')
const dropped = all.length - github.length
console.log(
  `Desktop: ${all.length} projeto(s) — ${github.length} GitHub para importar, ${dropped} local(is) ficam no desktop.`,
)
if (dryRun || github.length === 0) {
  for (const p of github) console.log(`  - ${p.source.nameWithOwner} (${p.status})`)
  process.exit(0)
}

const redis = new Redis({ url, token })
await redis.hset(
  'ps:projects',
  Object.fromEntries(github.map((p) => [p.id, p])),
)
console.log(`Importados ${github.length} projeto(s) para o KV (ps:projects).`)
