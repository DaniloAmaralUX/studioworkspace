import { promises as fs } from 'node:fs'
import path from 'node:path'

/**
 * Lê JSON com recuperação:
 * - arquivo ausente (ENOENT) → `fallback`;
 * - JSON inválido → renomeia para `<file>.bak-<ts>` (preserva o original para
 *   inspeção), loga warning e devolve `corruptFallback` (default: `fallback`).
 *   Passar um `corruptFallback` distinto permite ao caller diferenciar
 *   "nunca existiu" de "existia e corrompeu" (ex.: não re-seedar).
 */
export async function readJson<T>(
  file: string,
  fallback: T,
  corruptFallback: T = fallback,
): Promise<T> {
  let raw: string
  try {
    raw = await fs.readFile(file, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') return fallback
    throw err
  }
  try {
    // Strip de BOM: PowerShell 5.1 (Out-File/Set-Content utf8) grava UTF-8 com
    // BOM, e JSON.parse rejeita. Editar o JSON na mão no Windows não pode
    // derrubar (nem "corromper") o hub.
    return JSON.parse(raw.replace(/^\uFEFF/, '')) as T
  } catch {
    await backupCorrupt(file)
    return corruptFallback
  }
}

/**
 * Preserva um arquivo corrompido em `<file>.bak-<ts>` antes de o caller seguir
 * com fallback. rename é atômico; se falhar (lock transitório de AV), tenta
 * copyFile; se AMBOS falharem, relança — perder silenciosamente o único
 * exemplar dos dados do usuário viola a regra de ouro 3 do CLAUDE.md.
 */
export async function backupCorrupt(file: string): Promise<string> {
  const bak = `${file}.bak-${Date.now()}`
  try {
    await fs.rename(file, bak)
  } catch {
    try {
      await fs.copyFile(file, bak)
    } catch (copyErr) {
      console.error(
        `[atomicJson] conteúdo inválido em ${file} e NÃO consegui preservar backup — abortando para não sobrescrever dados.`,
      )
      throw copyErr
    }
  }
  console.warn(`[atomicJson] conteúdo inválido em ${file} — preservado em ${bak}; usando fallback.`)
  return bak
}

/** Escreve em arquivo temporário e faz rename atômico para não corromper em crash. */
export async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, file)
}
