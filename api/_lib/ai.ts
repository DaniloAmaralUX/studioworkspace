import OpenAI from 'openai'
import { generateText, gateway } from 'ai'

export type AiChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const GATEWAY_MODEL =
  process.env.PS_CHAT_MODEL ??
  process.env.PS_AI_MODEL ??
  'anthropic/claude-sonnet-4.6'
const AI_TIMEOUT_MS = 45_000

function cleanAssistantText(input: string): string {
  let text = input.trim()
  const finalThinkTag = text.toLowerCase().lastIndexOf('</think>')
  if (finalThinkTag >= 0) {
    text = text.slice(finalThinkTag + '</think>'.length)
  } else {
    const openThinkTag = text.toLowerCase().indexOf('<think>')
    if (openThinkTag >= 0) text = text.slice(0, openThinkTag)
  }
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

function bedrockConfigured(): boolean {
  return Boolean(process.env.AWS_BEARER_TOKEN_BEDROCK)
}

export function aiConfigured(): boolean {
  return Boolean(
    bedrockConfigured() ||
      process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN,
  )
}

function bedrockClient(): OpenAI {
  const region = process.env.AWS_REGION ?? 'us-east-2'
  const project = process.env.BEDROCK_OPENAI_PROJECT_ID
  return new OpenAI({
    apiKey: process.env.AWS_BEARER_TOKEN_BEDROCK,
    baseURL:
      process.env.BEDROCK_OPENAI_BASE_URL ??
      `https://bedrock-mantle.${region}.api.aws/v1`,
    defaultHeaders: project ? { 'OpenAI-Project': project } : undefined,
  })
}

export async function generateAiText(input: {
  system: string
  prompt: string
  maxTokens: number
}): Promise<{ text: string; model: string }> {
  if (bedrockConfigured()) {
    const model =
      process.env.BEDROCK_OPENAI_MODEL ?? 'moonshotai.kimi-k2.5'
    const completion = await bedrockClient().chat.completions.create(
      {
        model,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.prompt },
        ],
        max_tokens: Math.max(input.maxTokens, 64),
      },
      {
        maxRetries: 0,
        signal: AbortSignal.timeout(AI_TIMEOUT_MS),
        timeout: AI_TIMEOUT_MS,
      },
    )
    return {
      text: cleanAssistantText(
        completion.choices[0]?.message.content ?? '',
      ),
      model,
    }
  }

  const result = await generateText({
    model: gateway(GATEWAY_MODEL),
    system: input.system,
    prompt: input.prompt,
    maxOutputTokens: input.maxTokens,
    maxRetries: 0,
    timeout: AI_TIMEOUT_MS,
  })
  return { text: cleanAssistantText(result.text), model: GATEWAY_MODEL }
}

export async function generateAiChat(input: {
  system: string
  messages: AiChatMessage[]
  maxTokens: number
}): Promise<{ text: string; model: string }> {
  if (bedrockConfigured()) {
    const model =
      process.env.BEDROCK_OPENAI_MODEL ?? 'moonshotai.kimi-k2.5'
    const completion = await bedrockClient().chat.completions.create(
      {
        model,
        messages: [
          { role: 'system', content: input.system },
          ...input.messages,
        ],
        max_tokens: Math.max(input.maxTokens, 64),
      },
      {
        maxRetries: 0,
        signal: AbortSignal.timeout(AI_TIMEOUT_MS),
        timeout: AI_TIMEOUT_MS,
      },
    )
    return {
      text: cleanAssistantText(
        completion.choices[0]?.message.content ?? '',
      ),
      model,
    }
  }

  const result = await generateText({
    model: gateway(GATEWAY_MODEL),
    system: input.system,
    messages: input.messages,
    maxOutputTokens: input.maxTokens,
    maxRetries: 0,
    timeout: AI_TIMEOUT_MS,
  })
  return { text: cleanAssistantText(result.text), model: GATEWAY_MODEL }
}
