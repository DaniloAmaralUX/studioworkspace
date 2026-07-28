import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const providerMocks = vi.hoisted(() => ({
  bedrockCreate: vi.fn(),
  gateway: vi.fn(() => 'gateway-model'),
  generateText: vi.fn(),
}))

vi.mock('openai', () => ({
  default: class OpenAI {
    chat = {
      completions: {
        create: providerMocks.bedrockCreate,
      },
    }
  },
}))

vi.mock('ai', () => ({
  gateway: providerMocks.gateway,
  generateText: providerMocks.generateText,
}))

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('AWS_BEARER_TOKEN_BEDROCK', '')
  vi.stubEnv('AI_GATEWAY_API_KEY', '')
  providerMocks.bedrockCreate.mockReset()
  providerMocks.generateText.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('timeout das chamadas de IA cloud', () => {
  it('limita a chamada ao Bedrock sem repetir silenciosamente', async () => {
    vi.stubEnv('AWS_BEARER_TOKEN_BEDROCK', 'test-only')
    providerMocks.bedrockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Resposta' } }],
    })
    const { generateAiChat } = await import('../../api/_lib/ai.js')

    await generateAiChat({
      system: 'Sistema',
      messages: [{ role: 'user', content: 'Pergunta' }],
      maxTokens: 100,
    })

    expect(providerMocks.bedrockCreate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        maxRetries: 0,
        timeout: 45_000,
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('nunca devolve um bloco de raciocínio truncado pelo Kimi', async () => {
    vi.stubEnv('AWS_BEARER_TOKEN_BEDROCK', 'test-only')
    providerMocks.bedrockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: '<think>raciocínio privado ainda incompleto',
          },
        },
      ],
    })
    const { generateAiChat } = await import('../../api/_lib/ai.js')

    const result = await generateAiChat({
      system: 'Sistema',
      messages: [{ role: 'user', content: 'Pergunta' }],
      maxTokens: 100,
    })

    expect(result.text).toBe('')
  })

  it('limita também a chamada de fallback ao AI Gateway', async () => {
    vi.stubEnv('AI_GATEWAY_API_KEY', 'test-only')
    providerMocks.generateText.mockResolvedValue({ text: 'Resposta' })
    const { generateAiText } = await import('../../api/_lib/ai.js')

    await generateAiText({
      system: 'Sistema',
      prompt: 'Pergunta',
      maxTokens: 100,
    })

    expect(providerMocks.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        maxRetries: 0,
        timeout: 45_000,
      }),
    )
  })
})
