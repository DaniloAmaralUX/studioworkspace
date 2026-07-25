import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { OpenWithButtons } from './OpenWithButtons'
import type { Project } from '@/lib/types'

// Guarda do fluxo "clone sob demanda": projeto GitHub sem clone mostra o
// AlertDialog antes de qualquer coisa, e Cancelar NÃO clona nem abre.

vi.mock('@/lib/api', () => ({
  api: {
    getLaunchers: vi.fn().mockResolvedValue({
      explorer: true,
      terminal: true,
      claude: true,
      code: false,
      cursor: false,
    }),
    openProject: vi.fn().mockResolvedValue({ ok: true }),
    cloneProject: vi.fn().mockResolvedValue({}),
  },
}))

import { api } from '@/lib/api'

const GITHUB_SEM_CLONE: Project = {
  id: 'gh1',
  name: 'Repo',
  source: { kind: 'github', nameWithOwner: 'dan/repo' },
  status: 'planning',
  tags: [],
  stack: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('OpenWithButtons (GitHub sem clone)', () => {
  it('clicar num launcher abre o AlertDialog em vez de abrir direto', async () => {
    renderWithQuery(<OpenWithButtons project={GITHUB_SEM_CLONE} />)

    const explorer = await screen.findByRole('button', { name: /explorer/i })
    fireEvent.click(explorer)

    expect(
      await screen.findByRole('alertdialog', { name: /clonar antes de abrir/i }),
    ).toBeTruthy()
    expect(api.openProject).not.toHaveBeenCalled()
    expect(api.cloneProject).not.toHaveBeenCalled()
  })

  it('Cancelar fecha o dialog sem clonar nem abrir', async () => {
    renderWithQuery(<OpenWithButtons project={GITHUB_SEM_CLONE} />)

    fireEvent.click(await screen.findByRole('button', { name: /explorer/i }))
    await screen.findByRole('alertdialog')

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(api.cloneProject).not.toHaveBeenCalled()
    expect(api.openProject).not.toHaveBeenCalled()
  })

  it('só renderiza launchers detectados (code/cursor ficam de fora)', async () => {
    renderWithQuery(<OpenWithButtons project={GITHUB_SEM_CLONE} />)

    await screen.findByRole('button', { name: /explorer/i })
    expect(screen.queryByRole('button', { name: /vs code/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /cursor/i })).toBeNull()
  })
})
