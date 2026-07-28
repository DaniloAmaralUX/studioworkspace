import { promises as fs } from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'

const DEFAULT_REGION = 'us-east-2'
const DEFAULT_MODEL = 'moonshotai.kimi-k2.5'
const DEFAULT_PROJECT_ID = 'proj_ehx5s4fo4ilbgxy45v2e'

type AiSettingsInput = {
  apiKey?: string
  region: string
  projectId?: string
  model: string
}

export type AiSettingsStatus = {
  configured: boolean
  provider: 'amazon-bedrock'
  region: string
  baseUrl: string
  projectId: string | null
  model: string
  storage: 'backend/.env'
}

function envPath(): string {
  if (process.env.PS_BACKEND_ENV_PATH) {
    return path.resolve(process.env.PS_BACKEND_ENV_PATH)
  }
  return path.basename(process.cwd()).toLowerCase() === 'backend'
    ? path.join(process.cwd(), '.env')
    : path.join(process.cwd(), 'backend', '.env')
}

function value(name: string): string {
  return process.env[name]?.trim() ?? ''
}

function baseUrlFor(region: string): string {
  return `https://bedrock-mantle.${region}.api.aws/v1`
}

export function getAiSettings(): AiSettingsStatus {
  const region = value('AWS_REGION') || DEFAULT_REGION
  return {
    configured: Boolean(value('AWS_BEARER_TOKEN_BEDROCK')),
    provider: 'amazon-bedrock',
    region,
    baseUrl: value('BEDROCK_OPENAI_BASE_URL') || baseUrlFor(region),
    projectId:
      value('BEDROCK_OPENAI_PROJECT_ID') || DEFAULT_PROJECT_ID || null,
    model: value('BEDROCK_OPENAI_MODEL') || DEFAULT_MODEL,
    storage: 'backend/.env',
  }
}

function encodeEnvValue(input: string): string {
  return JSON.stringify(input)
}

function setEnvLine(source: string, name: string, nextValue: string): string {
  const line = `${name}=${encodeEnvValue(nextValue)}`
  const pattern = new RegExp(`^${name}=.*$`, 'm')
  if (pattern.test(source)) return source.replace(pattern, line)
  const separator = source.length === 0 || source.endsWith('\n') ? '' : '\n'
  return `${source}${separator}${line}\n`
}

export async function saveAiSettings(
  input: AiSettingsInput,
): Promise<AiSettingsStatus> {
  const target = envPath()
  let source = ''
  try {
    source = await fs.readFile(target, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  const region = input.region.trim()
  const projectId = input.projectId?.trim() ?? ''
  const model = input.model.trim()
  const baseUrl = baseUrlFor(region)

  if (input.apiKey?.trim()) {
    if (input.apiKey.trim().startsWith('sk-')) {
      throw new Error(
        'Esta é uma chave da OpenAI Platform. Use uma API key criada no console do Amazon Bedrock.',
      )
    }
    source = setEnvLine(
      source,
      'AWS_BEARER_TOKEN_BEDROCK',
      input.apiKey.trim(),
    )
    process.env.AWS_BEARER_TOKEN_BEDROCK = input.apiKey.trim()
  }
  source = setEnvLine(source, 'AWS_REGION', region)
  source = setEnvLine(source, 'BEDROCK_OPENAI_BASE_URL', baseUrl)
  source = setEnvLine(source, 'BEDROCK_OPENAI_PROJECT_ID', projectId)
  source = setEnvLine(source, 'BEDROCK_OPENAI_MODEL', model)

  await fs.mkdir(path.dirname(target), { recursive: true })
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(temp, source, { encoding: 'utf8', mode: 0o600 })
  await fs.rename(temp, target)

  process.env.AWS_REGION = region
  process.env.BEDROCK_OPENAI_BASE_URL = baseUrl
  process.env.BEDROCK_OPENAI_PROJECT_ID = projectId
  process.env.BEDROCK_OPENAI_MODEL = model
  return getAiSettings()
}

export function bedrockClient(): OpenAI {
  const apiKey = value('AWS_BEARER_TOKEN_BEDROCK')
  if (!apiKey) throw new Error('Bedrock não configurado.')
  const settings = getAiSettings()
  return new OpenAI({
    apiKey,
    baseURL: settings.baseUrl,
    defaultHeaders: settings.projectId
      ? { 'OpenAI-Project': settings.projectId }
      : undefined,
  })
}

export async function testAiConnection(): Promise<{
  ok: true
  model: string
}> {
  const settings = getAiSettings()
  const response = await bedrockClient().chat.completions.create({
    model: settings.model,
    messages: [{ role: 'user', content: 'Responda apenas OK.' }],
    max_tokens: 64,
  })
  if (!response.choices[0]?.message.content?.trim()) {
    throw new Error('O Bedrock respondeu sem conteúdo.')
  }
  return { ok: true, model: settings.model }
}
