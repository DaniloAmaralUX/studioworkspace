import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { LauncherKind } from '../lib/types'

const pExecFile = promisify(execFile)

async function onPath(cmd: string): Promise<boolean> {
  try {
    await pExecFile('where', [cmd], { windowsHide: true })
    return true
  } catch {
    return false
  }
}

async function hasClaudeProtocol(): Promise<boolean> {
  try {
    await pExecFile('reg', ['query', 'HKCU\\Software\\Classes\\claude'], {
      windowsHide: true,
    })
    return true
  } catch {
    return false
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
    case 'claude':
      // Fatia 3 — spike claude:// (deep-link para abrir uma pasta no Claude Desktop).
      throw new Error(
        'Abrir no Claude Code Desktop ainda não implementado (Fatia 3 — spike claude://).',
      )
  }
}
