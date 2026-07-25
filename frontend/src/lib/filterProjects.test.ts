import { describe, expect, it } from 'vitest'
import { filterProjects } from './filterProjects'
import type { Project } from '@/lib/types'

function proj(over: Partial<Project> & { id: string; name: string }): Project {
  return {
    source: { kind: 'local', path: `C:\\dev\\${over.id}` },
    status: 'building',
    tags: [],
    stack: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

const LIST: Project[] = [
  proj({ id: 'a', name: 'Project Studio', stack: ['ts', 'react'], tags: ['pessoal'] }),
  proj({
    id: 'b',
    name: 'Ouvidoria',
    stack: ['vite'],
    nextAction: 'Publicar na Vercel',
  }),
  proj({
    id: 'c',
    name: 'Site',
    source: { kind: 'github', nameWithOwner: 'DaniloAmaralUX/site' },
  }),
]

describe('filterProjects', () => {
  it('query vazia (ou só espaços) devolve a lista inteira', () => {
    expect(filterProjects(LIST, '')).toEqual(LIST)
    expect(filterProjects(LIST, '   ')).toEqual(LIST)
  })

  it('casa por nome, case-insensitive', () => {
    expect(filterProjects(LIST, 'ouvi').map((p) => p.id)).toEqual(['b'])
    expect(filterProjects(LIST, 'OUVIDORIA').map((p) => p.id)).toEqual(['b'])
  })

  it('casa por stack, tag e próxima ação', () => {
    expect(filterProjects(LIST, 'react').map((p) => p.id)).toEqual(['a'])
    expect(filterProjects(LIST, 'pessoal').map((p) => p.id)).toEqual(['a'])
    expect(filterProjects(LIST, 'vercel').map((p) => p.id)).toEqual(['b'])
  })

  it('casa pela fonte: path local e nameWithOwner do GitHub', () => {
    expect(filterProjects(LIST, 'c:\\dev\\a').map((p) => p.id)).toEqual(['a'])
    expect(filterProjects(LIST, 'daniloamaralux').map((p) => p.id)).toEqual(['c'])
  })

  it('sem match devolve vazio', () => {
    expect(filterProjects(LIST, 'zzz-nada')).toEqual([])
  })
})
