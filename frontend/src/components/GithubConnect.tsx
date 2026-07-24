import { LogOut } from 'lucide-react'
import { GithubIcon } from '@/components/GithubIcon'
import { API_BASE, IS_CLOUD } from '@/lib/api'
import { useGithubStatus, useGithubLogout } from '@/hooks/useProjects'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

/** Rodapé da sidebar: estado da conexão GitHub + entrar/sair (cloud usa OAuth). */
export function GithubConnect() {
  const { data: status, isLoading } = useGithubStatus()
  const logout = useGithubLogout()

  // Conectado: mostra o login (quando conhecido) e permite sair se veio de OAuth.
  if (status?.authed) {
    const label = status.login ? `@${status.login}` : 'GitHub conectado'
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip={label} className="cursor-default">
            <GithubIcon />
            <span className="truncate">{label}</span>
          </SidebarMenuButton>
          {status.via === 'oauth' && (
            <SidebarMenuButton
              size="sm"
              tooltip="Sair do GitHub"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="text-muted-foreground"
            >
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Não conectado, na nuvem, com OAuth disponível: link de login (página inteira).
  if (IS_CLOUD && status?.oauthAvailable) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Entrar com GitHub">
            <a href={`${API_BASE}/auth/login`}>
              <GithubIcon />
              <span>Entrar com GitHub</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Desktop (gh CLI) ou OAuth indisponível: dica passiva.
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled
          tooltip={
            isLoading
              ? 'Checando GitHub…'
              : IS_CLOUD
                ? 'OAuth não configurado na Vercel'
                : 'GitHub via gh CLI (gh auth login)'
          }
        >
          <GithubIcon />
          <span>{isLoading ? 'GitHub…' : 'GitHub desconectado'}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
