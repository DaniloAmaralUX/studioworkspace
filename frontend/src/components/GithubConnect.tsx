import { GithubIcon } from '@/components/GithubIcon'
import { IS_CLOUD } from '@/lib/api'
import { useGithubStatus } from '@/hooks/useProjects'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

/** Rodapé passivo: cloud usa o PAT read-only configurado apenas no servidor. */
export function GithubConnect() {
  const { data: status, isLoading } = useGithubStatus()

  if (status?.authed) {
    const label = status.login ? `@${status.login}` : 'GitHub conectado'
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip={label} className="cursor-default">
            <GithubIcon />
            <span className="truncate">{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const unavailableLabel = IS_CLOUD
    ? status?.error
      ? 'GitHub indisponível'
      : 'GitHub não configurado'
    : 'GitHub desconectado'
  const tooltip = isLoading
    ? 'Checando GitHub…'
    : IS_CLOUD
      ? status?.error
        ? 'Não foi possível validar a conexão do servidor'
        : 'Configure GITHUB_TOKEN read-only na Vercel'
      : 'GitHub via gh CLI (gh auth login)'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled
          tooltip={tooltip}
        >
          <GithubIcon />
          <span>{isLoading ? 'GitHub…' : unavailableLabel}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
