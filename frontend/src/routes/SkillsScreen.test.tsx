import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SkillsScreen } from './SkillsScreen'
import {
  skillCatalog,
  skillCollections,
} from '@/lib/skillCatalog'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('SkillsScreen', () => {
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

  it('mostra as duas coleções e as quinze skills', () => {
    render(<SkillsScreen />)

    expect(screen.getByRole('heading', { name: 'Skills' })).toBeTruthy()
    expect(screen.getByText('15 disponíveis')).toBeTruthy()

    for (const collection of skillCollections) {
      expect(screen.getByText(collection.installCommand)).toBeTruthy()
    }

    for (const item of skillCatalog) {
      expect(screen.getByRole('heading', { name: item.title })).toBeTruthy()
    }
  })

  it('copia o comando de uma skill e anuncia o resultado', async () => {
    render(<SkillsScreen />)

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Copiar comando de Acessibilidade',
      }),
    )

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(skillCatalog[0].command)
    })
    expect(screen.getByTestId('copy-status').textContent).toContain(
      'Comando de Acessibilidade copiado.',
    )
  })
})
