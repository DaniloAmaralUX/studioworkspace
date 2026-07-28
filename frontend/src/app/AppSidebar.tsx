import { NavLink, useLocation } from 'react-router-dom'
import {
  FolderKanban,
  Palette,
  LayoutTemplate,
  BookOpen,
  KeyRound,
  MessagesSquare,
} from 'lucide-react'
import { StudioLogo } from '@/components/StudioLogo'
import { GithubConnect } from '@/components/GithubConnect'
import { StudioAccess } from '@/components/StudioAccess'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { IS_CLOUD } from '@/lib/api'

const nav = [
  { title: 'Projetos', url: '/', icon: FolderKanban, end: true },
  { title: 'Temas', url: '/themes', icon: Palette, end: false },
  { title: 'Templates', url: '/templates', icon: LayoutTemplate, end: false },
  { title: 'Como usar', url: '/como-usar', icon: BookOpen, end: false },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/">
                <StudioLogo className="size-8 shrink-0 rounded-lg" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Studio</span>
                  <span className="truncate text-xs text-muted-foreground">
                    design engineer
                  </span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Organização</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const active = item.end
                  ? pathname === item.url
                  : pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url} end={item.end}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/context-project')}
                  tooltip="Context Project"
                >
                  <NavLink to="/context-project">
                    <MessagesSquare />
                    <span>Context Project</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {!IS_CLOUD && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/settings')}
                    tooltip="IA e APIs"
                  >
                    <NavLink to="/settings">
                      <KeyRound />
                      <span>IA e APIs</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <GithubConnect />
        {IS_CLOUD && <StudioAccess />}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
