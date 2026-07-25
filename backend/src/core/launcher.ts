import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { LauncherKind } from '../lib/types'

const pExecFile = promisify(execFile)

// Detecção nunca pode travar o hub: `where`/`reg` são rápidos, mas AV ou disco
// lento já causaram hangs — timeout mata o processo e trata como "não tem".
const EXEC_TIMEOUT_MS = 5000

async function onPath(cmd: string): Promise<boolean> {
  try {
    await pExecFile('where', [cmd], { windowsHide: true, timeout: EXEC_TIMEOUT_MS })
    return true
  } catch {
    return false
  }
}

async function hasClaudeProtocol(): Promise<boolean> {
  try {
    await pExecFile('reg', ['query', 'HKCU\\Software\\Classes\\claude'], {
      windowsHide: true,
      timeout: EXEC_TIMEOUT_MS,
    })
    return true
  } catch {
    return false
  }
}

// Lê o handler real do protocolo claude:// no registro (version-proof — o
// caminho do .exe muda a cada release do Claude Desktop).
async function claudeExePath(): Promise<string | null> {
  try {
    const { stdout } = await pExecFile(
      'reg',
      ['query', 'HKCU\\Software\\Classes\\claude\\shell\\open\\command', '/ve'],
      { windowsHide: true, timeout: EXEC_TIMEOUT_MS },
    )
    const match = stdout.match(/"([^"]+\.exe)"/i)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

export type Launchers = Record<LauncherKind, boolean>

export async function detectLaunchers(): Promise<Launchers> {
  const [terminal, code, cursor, claude] = await Promise.all([
    onPath('wt'),
    onPath('code'),
    onPath('cursor'),
    hasClaudeProtocol(),
  ])
  return { explorer: true, terminal, claude, code, cursor }
}

function spawnDetached(cmd: string, args: string[]): void {
  // explorer/wt costumam retornar exit code != 0 mesmo com sucesso — por isso
  // usamos spawn detached e ignoramos o código de saída.
  const child = spawn(cmd, args, { detached: true, stdio: 'ignore' })
  child.on('error', () => {})
  child.unref()
}

export async function openTarget(
  targetPath: string,
  kind: LauncherKind,
): Promise<void> {
  switch (kind) {
    case 'explorer':
      spawnDetached('explorer', [targetPath])
      return
    case 'terminal':
      spawnDetached('wt', ['-d', targetPath])
      return
    case 'code':
    case 'cursor':
      spawnDetached(kind, [targetPath])
      return
    case 'claude': {
      // claude://code/new?folder=<caminho-absoluto> — formato oficial
      // (support.claude.com). O próprio Claude Desktop mostra um diálogo de
      // confirmação da pasta antes de adotá-la.
      const url = `claude://code/new?folder=${encodeURIComponent(targetPath)}`
      const exe = await claudeExePath()
      if (exe) {
        spawnDetached(exe, [url])
      } else {
        // Fallback: sem handler no registro, deixa o Windows resolver o protocolo.
        spawnDetached('rundll32', ['url.dll,FileProtocolHandler', url])
      }
      return
    }
  }
}
