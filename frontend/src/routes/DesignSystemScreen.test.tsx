import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { DesignSystemScreen } from './DesignSystemScreen'
import { catalog, categories, installCommand } from '@/registry/catalog'
import { hasDemo, loadDemoSource } from '@/registry/demo-index'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

// Radix precisa destes no jsdom para montar overlays (dialog, select, sheet).
beforeAll(() => {
  const proto = window.HTMLElement.prototype as unknown as Record<
    string,
    unknown
  >
  proto.scrollIntoView ??= vi.fn()
  proto.hasPointerCapture ??= vi.fn(() => false)
  proto.setPointerCapture ??= vi.fn()
  proto.releasePointerCapture ??= vi.fn()
})

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

  it('renderiza o exemplo vivo de quem tem demo', async () => {
    render(<DesignSystemScreen />)

    // O demo de Button é lazy: só existe depois do chunk resolver.
    expect(
      await screen.findByRole('button', { name: 'Salvar' }),
    ).toBeTruthy()
    expect(screen.getAllByRole('tab', { name: 'Preview' }).length).toBe(
      catalog.filter((entry) => hasDemo(entry.name)).length,
    )
  })

  it('nenhuma entrada doc-only tem demo registrado', () => {
    for (const entry of catalog.filter((item) => item.docOnly)) {
      expect(hasDemo(entry.name)).toBe(false)
    }
  })

  it('todo componente que não é doc-only tem demo', () => {
    const semDemo = catalog
      .filter((entry) => !entry.docOnly)
      .filter((entry) => !hasDemo(entry.name))
      .map((entry) => entry.name)

    expect(semDemo).toEqual([])
  })

  it('abre um overlay a partir do demo sem derrubar a galeria', async () => {
    render(<DesignSystemScreen />)

    const trigger = await screen.findByRole('button', {
      name: 'Adicionar projeto',
    })
    fireEvent.click(trigger)

    expect(
      await screen.findByRole('heading', { name: 'Adicionar projeto' }),
    ).toBeTruthy()
  })

  it('carrega o fonte real do demo e o mantém em cache', async () => {
    const source = await loadDemoSource('button')

    expect(source).toContain("from '@/components/ui/button'")
    expect(source).toContain('export default function ButtonDemo')
    // Segunda chamada vem do cache, com o mesmo conteúdo.
    expect(await loadDemoSource('button')).toBe(source)
    expect(await loadDemoSource('componente-inexistente')).toBe(null)
  })
})
