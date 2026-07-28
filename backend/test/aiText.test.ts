import { describe, expect, it } from 'vitest'
import { cleanAssistantText } from '../src/core/aiText'

describe('cleanAssistantText', () => {
  it('mantém respostas comuns', () => {
    expect(cleanAssistantText('Resposta final.')).toBe('Resposta final.')
  })

  it('remove raciocínio antes da resposta final', () => {
    expect(
      cleanAssistantText(
        'Vou analisar internamente.\n</think> A resposta final é esta.',
      ),
    ).toBe('A resposta final é esta.')
  })

  it('remove bloco think completo', () => {
    expect(
      cleanAssistantText('<think>raciocínio privado</think>\nResposta.'),
    ).toBe('Resposta.')
  })
})
