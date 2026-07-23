import type { Project } from '../lib/types'

/** Projetos de exemplo criados no primeiro run (aponta para pastas reais desta máquina). */
export function seedProjects(): Project[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'seed-project-studio',
      name: 'Project Studio',
      source: { kind: 'local', path: 'C:\\Users\\dar\\Desktop\\project-studio' },
      status: 'building',
      nextAction: 'Terminar a Fatia 0 (hub + próxima ação)',
      tags: ['pessoal'],
      stack: ['ts'],
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-ouvidoria',
      name: 'Ouvidoria Pitang',
      source: { kind: 'local', path: 'C:\\Users\\dar\\Desktop\\OUVIDORIA PITANG' },
      status: 'review',
      nextAction: 'Revisar o design contra o /design',
      tags: ['trabalho'],
      stack: ['next', 'ts', 'tailwind'],
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ]
}
