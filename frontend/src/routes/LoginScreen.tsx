import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { KeyRound, LoaderCircle, LockKeyhole } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ThemeToggle } from '@/app/ThemeToggle'
import { StudioLogo } from '@/components/StudioLogo'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  return value.startsWith('/login') ? '/' : value
}

export function LoginScreen() {
  useDocumentTitle('Entrar')
  const [searchParams] = useSearchParams()
  const nextPath = useMemo(
    () => safeNextPath(searchParams.get('next')),
    [searchParams],
  )
  const [password, setPassword] = useState('')
  const [checking, setChecking] = useState(true)
  const [configured, setConfigured] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    api
      .studioAuthStatus()
      .then((status) => {
        if (!active) return
        setConfigured(status.configured)
        if (status.authenticated) window.location.replace(nextPath)
      })
      .catch(() => {
        if (active) setConfigured(false)
      })
      .finally(() => {
        if (active) setChecking(false)
      })
    return () => {
      active = false
    }
  }, [nextPath])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!password || submitting || !configured) return
    setSubmitting(true)
    try {
      await api.studioLogin(password)
      window.location.assign(nextPath)
    } catch (error) {
      toast.error('Não foi possível entrar', {
        description: (error as Error).message,
      })
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-background px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-primary),transparent_42%)] opacity-10"
        aria-hidden="true"
      />
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="relative w-full max-w-sm border-border/80 bg-card/85 shadow-2xl backdrop-blur-xl">
        <CardHeader className="text-center">
          <StudioLogo className="mx-auto mb-3 size-11 rounded-xl" />
          <CardTitle className="text-xl tracking-tight">
            Project Studio
          </CardTitle>
          <CardDescription>
            Seu workspace pessoal, protegido por senha.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {checking ? (
            <div className="space-y-4" aria-label="Verificando acesso">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : configured ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studio-password">Senha de acesso</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="studio-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={submitting}
                    className="pl-9"
                    placeholder="Digite sua senha"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!password || submitting}
              >
                {submitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <LockKeyhole className="size-4" />
                )}
                {submitting ? 'Entrando…' : 'Entrar no Studio'}
              </Button>
            </form>
          ) : (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm"
            >
              O login ainda não foi configurado na Vercel. Tente novamente
              após a publicação terminar.
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-center text-xs text-muted-foreground">
          Sessão segura por 7 dias · acesso pessoal
        </CardFooter>
      </Card>
    </main>
  )
}
