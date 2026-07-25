import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { NextActionInput } from './NextActionInput'

// Guarda do auto-save: 1 PATCH por pausa de digitação (700ms), blur salva na
// hora, e valor igual ao último salvo NÃO re-salva.

vi.mock('@/lib/api', () => ({
  api: {
    patchProject: vi.fn().mockResolvedValue({}),
    aiNextAction: vi.fn(),
  },
}))

import { api } from '@/lib/api'

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('NextActionInput', () => {
  it('debounce: nenhum PATCH antes de 700ms; exatamente 1 depois', async () => {
    renderWithQuery(<NextActionInput id="p1" value="" />)
    const input = screen.getByLabelText('Próxima ação')

    // Teclas espaçadas: cada tecla REINICIA o relógio do debounce — 1000ms
    // depois da primeira tecla ainda não salvou, porque a última foi há 500ms.
    // (versões *Async: a mutação do react-query encadeia microtasks antes de
    // chamar a api — o relógio fake precisa ceder o event loop.)
    fireEvent.change(input, { target: { value: 'a' } })
    await vi.advanceTimersByTimeAsync(500)
    fireEvent.change(input, { target: { value: 'ab' } })
    await vi.advanceTimersByTimeAsync(500)
    expect(api.patchProject).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(200)
    expect(api.patchProject).toHaveBeenCalledTimes(1)
    expect(api.patchProject).toHaveBeenCalledWith('p1', { nextAction: 'ab' })
  })

  it('blur salva imediatamente, sem esperar o debounce', async () => {
    renderWithQuery(<NextActionInput id="p1" value="" />)
    const input = screen.getByLabelText('Próxima ação')

    fireEvent.change(input, { target: { value: 'novo texto' } })
    fireEvent.blur(input)
    await vi.advanceTimersByTimeAsync(0)

    expect(api.patchProject).toHaveBeenCalledTimes(1)
    expect(api.patchProject).toHaveBeenCalledWith('p1', { nextAction: 'novo texto' })

    // Nenhum segundo PATCH acontece (cancelamento do timer OU guarda de
    // igualdade — o contrato visível é: sem PATCH duplicado).
    await vi.advanceTimersByTimeAsync(2000)
    expect(api.patchProject).toHaveBeenCalledTimes(1)
  })

  it('valor igual ao último salvo não dispara PATCH', async () => {
    renderWithQuery(<NextActionInput id="p1" value="já salvo" />)
    const input = screen.getByLabelText('Próxima ação')

    fireEvent.blur(input)
    await vi.advanceTimersByTimeAsync(2000)
    expect(api.patchProject).not.toHaveBeenCalled()
  })
})
