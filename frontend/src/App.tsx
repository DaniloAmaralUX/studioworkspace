import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/app/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { AppLayout } from '@/app/AppLayout'
import { ProjectsScreen } from '@/routes/ProjectsScreen'
import { ProjectDetail } from '@/routes/ProjectDetail'
import { LoginScreen } from '@/routes/LoginScreen'
import { IS_CLOUD } from '@/lib/api'

// Telas secundárias fora do chunk inicial (F4): o ciclo diário é
// achar → decidir → abrir, então só Projects e ProjectDetail ficam eager.
// (.then(m => ({default: ...})) adapta named export ao lazy sem tocar as telas.)
const ThemesScreen = lazy(() =>
  import('@/routes/ThemesScreen').then((m) => ({ default: m.ThemesScreen })),
)
const TemplatesScreen = lazy(() =>
  import('@/routes/TemplatesScreen').then((m) => ({ default: m.TemplatesScreen })),
)
const SkillsScreen = lazy(() =>
  import('@/routes/SkillsScreen').then((m) => ({ default: m.SkillsScreen })),
)
const FoundationScreen = lazy(() =>
  import('@/routes/FoundationScreen').then((m) => ({ default: m.FoundationScreen })),
)
const HowToScreen = lazy(() =>
  import('@/routes/HowToScreen').then((m) => ({ default: m.HowToScreen })),
)
const SettingsScreen = lazy(() =>
  import('@/routes/SettingsScreen').then((m) => ({
    default: m.SettingsScreen,
  })),
)
const ChatScreen = lazy(() =>
  import('@/routes/ChatScreen').then((m) => ({ default: m.ChatScreen })),
)

function ScreenFallback() {
  return (
    <div className="grid min-h-48 place-items-center text-sm text-muted-foreground">
      Carregando…
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Routes>
          {IS_CLOUD && <Route path="login" element={<LoginScreen />} />}
          <Route element={<AppLayout />}>
            <Route index element={<ProjectsScreen />} />
            <Route
              path="themes"
              element={
                <Suspense fallback={<ScreenFallback />}>
                  <ThemesScreen />
                </Suspense>
              }
            />
            <Route
              path="templates"
              element={
                <Suspense fallback={<ScreenFallback />}>
                  <TemplatesScreen />
                </Suspense>
              }
            />
            <Route
              path="skills"
              element={
                <Suspense fallback={<ScreenFallback />}>
                  <SkillsScreen />
                </Suspense>
              }
            />
            <Route
              path="como-usar"
              element={
                <Suspense fallback={<ScreenFallback />}>
                  <HowToScreen />
                </Suspense>
              }
            />
            <Route
              path="context-project"
              element={
                <Suspense fallback={<ScreenFallback />}>
                  <ChatScreen />
                </Suspense>
              }
            />
            {!IS_CLOUD && (
              <Route
                path="settings"
                element={
                  <Suspense fallback={<ScreenFallback />}>
                    <SettingsScreen />
                  </Suspense>
                }
              />
            )}
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route
              path="projects/:id/foundation"
              element={
                <Suspense fallback={<ScreenFallback />}>
                  <FoundationScreen />
                </Suspense>
              }
            />
          </Route>
        </Routes>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
