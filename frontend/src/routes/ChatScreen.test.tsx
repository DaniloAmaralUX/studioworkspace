import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ChatResponse } from '@/lib/api'
import type { Project } from '@/lib/types'
import { ChatScreen } from './ChatScreen'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

vi.mock('@/lib/api', () => ({
  IS_CLOUD: true,
  api: {
    listProjects: vi.fn(),
    patchProject: vi.fn(),
    chat: vi.fn(),
  },
}))

import { api } from '@/lib/api'

const GITHUB_PROJECT: Project = {
  id: 'github-project',
  name: 'Projeto GitHub',
  source: { kind: 'github', nameWithOwner: 'danilo/projeto' },
  status: 'building',
  nextAction: 'Ação anterior',
  tags: ['produto'],
  stack: ['react', 'typescript'],
  createdAt: '2026-07-01T12:00:00.000Z',
  updatedAt: '2026-07-27T20:00:00.000Z',
}

const LOCAL_PROJECT: Project = {
  ...GITHUB_PROJECT,
  id: 'local-project',
  name: 'Projeto local',
  source: { kind: 'local', path: 'C:\\projeto' },
}

const CONTEXTUAL_RESPONSE: ChatResponse = {
  message: {
    role: 'assistant',
    content: 'O projeto está em desenvolvimento ativo.',
  },
  model: 'moonshotai.kimi-k2.5',
  context: {
    projectId: GITHUB_PROJECT.id,
    projectName: GITHUB_PROJECT.name,
    repository: 'danilo/projeto',
    fetchedAt: '2026-07-28T00:15:00.000Z',
    status: 'partial',
    warnings: ['README não encontrado.'],
    sources: [
      {
        id: 'repository',
        kind: 'repository',
        label: 'danilo/projeto',
        url: 'https://github.com/danilo/projeto',
      },
      {
        id: 'commit:abc1234',
        kind: 'commit',
        label: 'abc1234 · Implementa contexto',
        url: 'https://github.com/danilo/projeto/commit/abc1234',
        occurredAt: '2026-07-27T22:00:00.000Z',
      },
    ],
  },
  suggestedNextAction: 'Validar o contexto em produção.',
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ChatScreen />
    </QueryClientProvider>,
  )
}

async function chooseContext(name: string) {
  const trigger = await screen.findByRole('combobox', {
    name: 'Contexto da conversa',
  })
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  fireEvent.click(await screen.findByRole('option', { name }))
}

async function send(content: string) {
  fireEvent.change(
    screen.getByRole('textbox', {
      name: 'Mensagem para o Context Project',
    }),
    { target: { value: content } },
  )
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
}

beforeEach(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: vi.fn(() => false),
  })
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: vi.fn(),
  })

  vi.mocked(api.listProjects).mockResolvedValue([
    GITHUB_PROJECT,
    LOCAL_PROJECT,
  ])
  vi.mocked(api.patchProject).mockImplementation(async (id, patch) => ({
    ...GITHUB_PROJECT,
    id,
    ...patch,
  }))
  vi.mocked(api.chat).mockResolvedValue({
    message: { role: 'assistant', content: 'Resposta geral.' },
    model: 'moonshotai.kimi-k2.5',
    context: null,
    suggestedNextAction: null,
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ChatScreen', () => {
  it('mantém a conversa geral sem projectId e não oferece projeto local na cloud', async () => {
    renderScreen()

    const trigger = await screen.findByRole('combobox', {
      name: 'Contexto da conversa',
    })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })

    expect(
      await screen.findByRole('option', { name: 'Projeto GitHub' }),
    ).toBeTruthy()
    expect(
      screen.queryByRole('option', { name: 'Projeto local' }),
    ).toBeNull()

    fireEvent.keyDown(document.activeElement ?? trigger, { key: 'Escape' })
    await send('Qual é a data?')

    await screen.findByText('Resposta geral.')
    expect(api.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: undefined,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'Qual é a data?',
          }),
        ]),
      }),
      expect.any(AbortSignal),
    )
  })

  it('mostra evidências e salva explicitamente a próxima ação sugerida', async () => {
    vi.mocked(api.chat).mockResolvedValue(CONTEXTUAL_RESPONSE)
    renderScreen()

    await chooseContext('Projeto GitHub')
    await send('Qual é o estado do projeto?')

    await screen.findByText('O projeto está em desenvolvimento ativo.')
    expect(api.chat).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: GITHUB_PROJECT.id }),
      expect.any(AbortSignal),
    )

    const context = screen.getByLabelText(
      'Contexto consultado para Projeto GitHub',
    )
    expect(context.textContent).toContain('Consultado em')
    expect(context.textContent).toContain('Parcial')
    expect(context.textContent).toContain('README não encontrado.')

    fireEvent.click(
      screen.getByRole('button', { name: '2 fontes consultadas' }),
    )
    expect(
      (
        await screen.findByRole('link', { name: /Implementa contexto/ })
      ).getAttribute('href'),
    ).toBe('https://github.com/danilo/projeto/commit/abc1234')

    fireEvent.click(
      screen.getByRole('button', { name: 'Salvar como próxima ação' }),
    )
    await waitFor(() => {
      expect(api.patchProject).toHaveBeenCalledWith(GITHUB_PROJECT.id, {
        nextAction: 'Validar o contexto em produção.',
      })
    })
    expect(
      (
        await screen.findByRole('button', { name: 'Próxima ação salva' })
      ) as HTMLButtonElement,
    ).toHaveProperty('disabled', true)
  })

  it('reconhece quando a ação sugerida já está salva', async () => {
    vi.mocked(api.chat).mockResolvedValue({
      ...CONTEXTUAL_RESPONSE,
      suggestedNextAction: GITHUB_PROJECT.nextAction ?? null,
    })
    renderScreen()

    await chooseContext('Projeto GitHub')
    await send('Qual é a próxima ação?')

    const savedButton = await screen.findByRole('button', {
      name: 'Próxima ação salva',
    })
    expect(savedButton).toHaveProperty('disabled', true)
    expect(api.patchProject).not.toHaveBeenCalled()
  })

  it('mantém a sugestão disponível e mostra erro quando salvar falha', async () => {
    vi.mocked(api.chat).mockResolvedValue(CONTEXTUAL_RESPONSE)
    vi.mocked(api.patchProject).mockRejectedValueOnce(
      new Error('Falha de escrita no Studio.'),
    )
    renderScreen()

    await chooseContext('Projeto GitHub')
    await send('Qual é a próxima ação?')
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Salvar como próxima ação',
      }),
    )

    expect(await screen.findByText('Falha de escrita no Studio.')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Tentar salvar novamente' }),
    ).toBeTruthy()
  })

  it('pede confirmação antes de trocar e mantém a conversa ao cancelar', async () => {
    renderScreen()
    await chooseContext('Projeto GitHub')
    await send('Continue daqui.')
    await screen.findByText('Resposta geral.')

    await chooseContext('Conversa geral')
    expect(
      await screen.findByRole('alertdialog', {
        name: 'Trocar o contexto da conversa?',
      }),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Manter conversa' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByText('Resposta geral.')).toBeTruthy()
    expect(
      screen.getByRole('combobox', { name: 'Contexto da conversa' }).textContent,
    ).toContain('Projeto GitHub')
  })

  it('aborta a resposta em andamento e limpa a conversa ao confirmar a troca', async () => {
    let requestSignal: AbortSignal | undefined
    vi.mocked(api.chat).mockImplementation(
      (_input, signal) =>
        new Promise((_resolve, reject) => {
          requestSignal = signal
          signal?.addEventListener('abort', () => {
            reject(new DOMException('Cancelada', 'AbortError'))
          })
        }),
    )
    renderScreen()

    await chooseContext('Projeto GitHub')
    await send('Analise agora.')
    expect(await screen.findByText('Kimi está pensando…')).toBeTruthy()

    await chooseContext('Conversa geral')
    fireEvent.click(
      await screen.findByRole('button', { name: 'Trocar e limpar' }),
    )

    expect(requestSignal?.aborted).toBe(true)
    expect(screen.queryByText('Analise agora.')).toBeNull()
    expect(screen.queryByText('Kimi está pensando…')).toBeNull()
    expect(
      screen.getByText(/Escolha um projeto para conversar com o contexto/),
    ).toBeTruthy()
  })
})
