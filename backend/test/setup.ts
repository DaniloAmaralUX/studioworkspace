import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

// Isola os testes dos dados reais (%APPDATA%\project-studio). O config.ts lê
// estas envs no import, então elas precisam existir ANTES do app ser importado
// — por isso vivem no setupFile, que o vitest executa antes de cada arquivo.
process.env.PS_DATA_DIR = mkdtempSync(path.join(tmpdir(), 'ps-test-data-'))
process.env.PS_WORK_DIR = mkdtempSync(path.join(tmpdir(), 'ps-test-work-'))
