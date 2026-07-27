import type { Project } from '@/lib/types'

/** Texto identificador da fonte (o que aparece na linha e entra na busca). */
export function sourceText(p: Project): string {
  return p.source.kind === 'github' ? p.source.nameWithOwner : p.source.path
}

/**
 * Filtro da busca do hub ("achar <5s"): casa termo em nome, fonte, tags,
 * stack e próxima ação. Função pura extraída do ProjectsScreen para os
 * testes de guarda do core (F3).
 */
export function filterProjects(list: Project[], query: string): Project[] {
  const term = query.trim().toLowerCase()
  if (!term) return list
  return list.filter((p) =>
    [p.name, sourceText(p), ...p.tags, ...p.stack, p.nextAction ?? '']
      .join(' ')
      .toLowerCase()
      .includes(term),
  )
}
