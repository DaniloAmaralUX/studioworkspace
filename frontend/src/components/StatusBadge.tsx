import type { ProjectStatus } from '@/lib/types'

const LABEL: Record<ProjectStatus, string> = {
  planning: 'Planejando',
  building: 'Construindo',
  review: 'Em revisão',
  blocked: 'Bloqueado',
  done: 'Concluído',
}

/** Pílula de status com cor semântica (token --status-*), estilo Linear. */
export function StatusBadge({ status }: { status: ProjectStatus }) {
  const c = `var(--status-${status})`
  // O texto usa o papel "tinta" (L rebaixado no tema claro); o ponto e o tint
  // seguem o token de status. Cor nunca e o unico sinal: o rotulo diz o estado.
  const ink = `var(--status-${status}-ink)`
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
      style={{
        color: ink,
        borderColor: `color-mix(in oklch, ${c} 38%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${c} 13%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: c }} />
      {LABEL[status]}
    </span>
  )
}
