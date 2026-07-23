import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Lê status git da pasta local (execFile, sem shell, com timeout). Só lê; nunca escreve.
const pExecFile = promisify(execFile)
const GIT_TIMEOUT = 10_000

export type GitInfo =
  | { isRepo: false; reason?: string }
  | {
      isRepo: true
      branch: string
      dirtyCount: number
      lastCommit: string | null
      ahead: number
      behind: number
    }

export async function gitInfo(dir: string): Promise<GitInfo> {
  const run = (args: string[]) =>
    pExecFile('git', ['-C', dir, ...args], {
      windowsHide: true,
      timeout: GIT_TIMEOUT,
    })

  try {
    const { stdout: branch } = await run(['rev-parse', '--abbrev-ref', 'HEAD'])
    const { stdout: status } = await run(['status', '--porcelain'])
    const dirtyCount = status.trim() ? status.trim().split('\n').length : 0

    let lastCommit: string | null = null
    try {
      const { stdout } = await run(['log', '-1', '--pretty=%h %s'])
      lastCommit = stdout.trim() || null
    } catch {
      /* repo sem commits */
    }

    let ahead = 0
    let behind = 0
    try {
      const { stdout } = await run([
        'rev-list',
        '--left-right',
        '--count',
        'HEAD...@{upstream}',
      ])
      const parts = stdout.trim().split(/\s+/).map((n) => Number(n) || 0)
      ahead = parts[0] ?? 0
      behind = parts[1] ?? 0
    } catch {
      /* sem upstream configurado */
    }

    return { isRepo: true, branch: branch.trim(), dirtyCount, lastCommit, ahead, behind }
  } catch {
    return { isRepo: false, reason: 'not-a-git-repo' }
  }
}
