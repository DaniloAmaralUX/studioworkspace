import { promises as fs } from 'node:fs'
import path from 'node:path'

// Detecção leve de stack a partir dos arquivos da pasta. Só lê; nunca escreve.
export async function detectStack(dir: string): Promise<string[]> {
  const stack = new Set<string>()

  try {
    const raw = await fs.readFile(path.join(dir, 'package.json'), 'utf8')
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
    const has = (name: string) => name in deps
    if (has('next')) stack.add('next')
    if (has('vite')) stack.add('vite')
    if (has('react')) stack.add('react')
    if (has('vue')) stack.add('vue')
    if (has('svelte')) stack.add('svelte')
    if (has('@angular/core')) stack.add('angular')
    if (has('tailwindcss')) stack.add('tailwind')
    if (has('typescript')) stack.add('ts')
    if (has('fastify')) stack.add('fastify')
    if (has('express')) stack.add('express')
  } catch {
    /* sem package.json */
  }

  const exists = async (f: string) =>
    !!(await fs.stat(path.join(dir, f)).catch(() => null))

  if (!stack.has('ts') && (await exists('tsconfig.json'))) stack.add('ts')
  if (await exists('go.mod')) stack.add('go')
  if ((await exists('requirements.txt')) || (await exists('pyproject.toml')))
    stack.add('python')
  if (await exists('Cargo.toml')) stack.add('rust')
  if (await exists('pom.xml')) stack.add('java')

  return [...stack]
}
