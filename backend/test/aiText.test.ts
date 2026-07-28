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

  it('remove raciocínio truncado sem tag de fechamento', () => {
    expect(
      cleanAssistantText('<think>raciocínio privado ainda incompleto'),
    ).toBe('')
    expect(
      cleanAssistantText(
        'Texto seguro.<think>raciocínio privado ainda incompleto',
      ),
    ).toBe('Texto seguro.')
  })
})
