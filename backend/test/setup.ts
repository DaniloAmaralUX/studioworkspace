import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

// Isola os testes dos dados reais (%APPDATA%\project-studio). O config.ts lê
// estas envs no import, então elas precisam existir ANTES do app ser importado
// — por isso vivem no setupFile, que o vitest executa antes de cada arquivo.
process.env.PS_DATA_DIR = mkdtempSync(path.join(tmpdir(), 'ps-test-data-'))
process.env.PS_WORK_DIR = mkdtempSync(path.join(tmpdir(), 'ps-test-work-'))
process.env.PS_BACKEND_ENV_PATH = path.join(
  mkdtempSync(path.join(tmpdir(), 'ps-test-env-')),
  '.env',
)
delete process.env.AWS_BEARER_TOKEN_BEDROCK
delete process.env.AWS_REGION
delete process.env.BEDROCK_OPENAI_BASE_URL
delete process.env.BEDROCK_OPENAI_PROJECT_ID
delete process.env.BEDROCK_OPENAI_MODEL
