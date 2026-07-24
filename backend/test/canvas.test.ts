import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  app = await buildApp({ logger: false })
  await app.ready() // exigido antes de injectWS
})
afterAll(async () => {
  await app.close()
})

describe('canvas ws echo (M0)', () => {
  it('ecoa a mensagem enviada', async () => {
    const ws = await app.injectWS('/api/canvas/ws-echo')
    const got = new Promise<string>((resolve) => {
      ws.on('message', (m: Buffer) => resolve(m.toString()))
    })
    ws.send('ping-maestri')
    expect(await got).toBe('ping-maestri')
    ws.terminate()
  })
})

describe('spike PTY (M0)', () => {
  it('spawna powershell e recebe output', async () => {
    const pty = await import('@lydell/node-pty')
    const out = await new Promise<string>((resolve, reject) => {
      const p = pty.spawn(
        'powershell.exe',
        ['-NoLogo', '-Command', 'echo maestri-pty-ok'],
        { name: 'xterm-color', cols: 80, rows: 24, cwd: process.cwd() },
      )
      let buf = ''
      const to = setTimeout(() => {
        try {
          p.kill()
        } catch {
          /* já morto */
        }
        reject(new Error('timeout sem output do PTY'))
      }, 20000)
      p.onData((d) => {
        buf += d
        if (buf.includes('maestri-pty-ok')) {
          clearTimeout(to)
          try {
            p.kill()
          } catch {
            /* já morto */
          }
          resolve(buf)
        }
      })
    })
    expect(out).toContain('maestri-pty-ok')
  }, 25000)
})
