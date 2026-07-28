import { useState } from 'react'
import { LoaderCircle, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { api } from '@/lib/api'

export function StudioAccess() {
  const [pending, setPending] = useState(false)

  async function logout() {
    if (pending) return
    setPending(true)
    try {
      await api.studioLogout()
      window.location.assign('/login')
    } catch (error) {
      toast.error('Não foi possível sair', {
        description: (error as Error).message,
      })
      setPending(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="Sair do Studio"
          onClick={logout}
          disabled={pending}
          className="text-muted-foreground"
        >
          {pending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <LogOut />
          )}
          <span>Sair do Studio</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
