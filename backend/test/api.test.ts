import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  app = await buildApp({ logger: false })
})
afterAll(async () => {
  await app.close()
})

describe('health', () => {
  it('responde { ok: true }', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })
  })
})

describe('projects', () => {
  it('semeia 2 projetos de exemplo no primeiro load', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(2)
  })

  it('rejeita body inválido ao associar pasta local (schema)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects/local',
      payload: {},
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('invalid_body')
  })

  it('rejeita caminho que não é pasta', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects/local',
      payload: { path: path.join(tmpdir(), 'ps-nao-existe-de-jeito-nenhum-42') },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('not_a_dir')
  })

  it('associa pasta local, deduplica, edita e remove', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ps-test-proj-'))

    const created = await app.inject({
      method: 'POST',
      url: '/api/projects/local',
      payload: { path: dir },
    })
    expect(created.statusCode).toBe(201)
    const project = created.json()
    expect(project.name).toBe(path.basename(dir))
    expect(project.source.kind).toBe('local')

    const dup = await app.inject({
      method: 'POST',
      url: '/api/projects/local',
      payload: { path: dir },
    })
    expect(dup.statusCode).toBe(409)
    expect(dup.json().error.code).toBe('duplicate')

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/projects/${project.id}`,
      payload: { nextAction: 'Escrever mais testes', status: 'building' },
    })
    expect(patched.statusCode).toBe(200)
    expect(patched.json().nextAction).toBe('Escrever mais testes')
    expect(patched.json().status).toBe('building')

    const badPatch = await app.inject({
      method: 'PATCH',
      url: `/api/projects/${project.id}`,
      payload: { status: 'inventado' },
    })
    expect(badPatch.statusCode).toBe(400)
    expect(badPatch.json().error.code).toBe('invalid_body')

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${project.id}`,
    })
    expect(del.statusCode).toBe(200)
    expect(del.json()).toEqual({ ok: true })

    const delAgain = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${project.id}`,
    })
    expect(delAgain.statusCode).toBe(404)
    expect(delAgain.json().error.code).toBe('not_found')
  })

  it('PATCH em id desconhecido responde 404 no envelope', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/projects/nao-existe',
      payload: { status: 'done' },
    })
    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('not_found')
  })
})

describe('open', () => {
  it('rejeita launcher desconhecido via schema', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects/qualquer/open',
      payload: { with: 'vim' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('invalid_body')
  })

  it('404 para projeto inexistente com launcher válido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects/nao-existe/open',
      payload: { with: 'explorer' },
    })
    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('not_found')
  })
})

describe('templates', () => {
  it('CRUD com validação de schema', async () => {
    const bad = await app.inject({
      method: 'POST',
      url: '/api/templates',
      payload: { name: 'sem repo' },
    })
    expect(bad.statusCode).toBe(400)
    expect(bad.json().error.code).toBe('invalid_body')

    const created = await app.inject({
      method: 'POST',
      url: '/api/templates',
      payload: { name: 'Base Vite', repoUrl: 'https://github.com/acme/base' },
    })
    expect(created.statusCode).toBe(201)
    const tpl = created.json()
    expect(tpl.id).toBeTruthy()

    const list = await app.inject({ method: 'GET', url: '/api/templates' })
    expect(list.json().some((t: { id: string }) => t.id === tpl.id)).toBe(true)

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/templates/${tpl.id}`,
    })
    expect(del.json()).toEqual({ ok: true })
  })
})

describe('configuração de IA', () => {
  it('rejeita chave da OpenAI Platform no campo do Bedrock', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/settings/ai',
      payload: {
        apiKey: 'sk-proj-not-a-real-openai-key',
        region: 'us-east-2',
        projectId: 'proj_ehx5s4fo4ilbgxy45v2e',
        model: 'openai.gpt-oss-120b',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).not.toContain('sk-proj-not-a-real-openai-key')
    expect(response.json().error.message).toContain('Amazon Bedrock')
  })

  it('salva a chave somente no env e nunca a devolve pela API', async () => {
    const secret = 'bedrock-test-key-not-a-real-credential'
    const saved = await app.inject({
      method: 'PUT',
      url: '/api/settings/ai',
      payload: {
        apiKey: secret,
        region: 'us-east-2',
        projectId: 'proj_ehx5s4fo4ilbgxy45v2e',
        model: 'openai.gpt-oss-120b',
      },
    })

    expect(saved.statusCode).toBe(200)
    expect(saved.json()).toMatchObject({
      configured: true,
      provider: 'amazon-bedrock',
      region: 'us-east-2',
      projectId: 'proj_ehx5s4fo4ilbgxy45v2e',
      model: 'openai.gpt-oss-120b',
      storage: 'backend/.env',
    })
    expect(saved.body).not.toContain(secret)

    const status = await app.inject({
      method: 'GET',
      url: '/api/settings/ai',
    })
    expect(status.body).not.toContain(secret)
    expect(status.json().configured).toBe(true)

    const envFile = readFileSync(process.env.PS_BACKEND_ENV_PATH!, 'utf8')
    expect(envFile).toContain(secret)
    expect(envFile).toContain('AWS_REGION=\"us-east-2\"')
  })
})

describe('Context Project', () => {
  it('injeta a data atual de Fortaleza e proíbe inventar fatos recentes', async () => {
    const { buildChatSystem } = await import('../src/routes/chat')
    const system = buildChatSystem(new Date('2026-07-28T15:30:00.000Z'))

    expect(system).toContain('28 de julho de 2026')
    expect(system).toContain('America/Fortaleza')
    expect(system).toContain('informação autoritativa')
    expect(system).toContain('não possui uma fonte atualizada')
  })

  it('valida mensagens e exige Bedrock configurado', async () => {
    delete process.env.AWS_BEARER_TOKEN_BEDROCK

    const invalid = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: { messages: [] },
    })
    expect(invalid.statusCode).toBe(400)

    const unavailable = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: {
        messages: [{ role: 'user', content: 'Olá' }],
      },
    })
    expect(unavailable.statusCode).toBe(503)
    expect(unavailable.json().error.code).toBe('ai_not_configured')
  })
})

describe('error handler global', () => {
  it('JSON malformado responde no envelope { error }', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects/local',
      payload: '{invalido',
      headers: { 'content-type': 'application/json' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.message).toBeTruthy()
  })
})
