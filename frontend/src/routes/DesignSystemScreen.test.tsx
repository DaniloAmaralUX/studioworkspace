import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { DesignSystemScreen } from './DesignSystemScreen'
import { catalog, categories, installCommand } from '@/registry/catalog'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('DesignSystemScreen', () => {
  const writeText = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    writeText.mockClear()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('lista todos os componentes do catálogo agrupados por categoria', () => {
    render(<DesignSystemScreen />)

    expect(
      screen.getByRole('heading', { name: 'Design System', level: 1 }),
    ).toBeTruthy()
    expect(screen.getByText(`${catalog.length} componentes`)).toBeTruthy()

    for (const entry of catalog) {
      expect(screen.getByRole('heading', { name: entry.title })).toBeTruthy()
    }

    for (const category of categories) {
      const used = catalog.some((entry) => entry.category === category.id)
      if (used) {
        expect(
          screen.getByRole('heading', { name: category.label }),
        ).toBeTruthy()
      }
    }
  })

  it('mostra o comando de instalação de cada componente', () => {
    render(<DesignSystemScreen />)

    for (const entry of catalog) {
      expect(screen.getByText(installCommand(entry.name))).toBeTruthy()
    }
  })

  it('copia o comando de um componente e anuncia o resultado', async () => {
    render(<DesignSystemScreen />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Copiar comando de Button' }),
    )

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(installCommand('button'))
    })
    expect(screen.getByTestId('copy-status').textContent).toContain(
      'Comando de Button copiado.',
    )
  })

  it('marca como sem demo apenas as entradas doc-only', () => {
    render(<DesignSystemScreen />)

    const docOnly = catalog.filter((entry) => entry.docOnly)
    expect(docOnly.length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sem demo').length).toBe(docOnly.length)
  })
})
