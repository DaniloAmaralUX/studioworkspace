import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/app/ThemeProvider'
import { AppLayout } from '@/app/AppLayout'
import { ProjectsScreen } from '@/routes/ProjectsScreen'
import { ThemesScreen } from '@/routes/ThemesScreen'
import { TemplatesScreen } from '@/routes/TemplatesScreen'
import { ProjectDetail } from '@/routes/ProjectDetail'
import { FoundationScreen } from '@/routes/FoundationScreen'
import { HowToScreen } from '@/routes/HowToScreen'
import { IS_CLOUD } from '@/lib/api'

// Modo Maestri: desktop-only e pesado (React Flow) — carregado sob demanda e
// mantido fora do bundle da nuvem (mesma SPA), onde PTY não roda.
const CanvasScreen = lazy(() => import('@/routes/CanvasScreen'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<ProjectsScreen />} />
            <Route path="themes" element={<ThemesScreen />} />
            <Route path="templates" element={<TemplatesScreen />} />
            <Route path="como-usar" element={<HowToScreen />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route
              path="projects/:id/foundation"
              element={<FoundationScreen />}
            />
          </Route>
          {!IS_CLOUD && (
            <Route
              path="projects/:id/canvas"
              element={
                <Suspense
                  fallback={
                    <div className="grid h-svh place-items-center text-sm text-muted-foreground">
                      Carregando canvas…
                    </div>
                  }
                >
                  <CanvasScreen />
                </Suspense>
              }
            />
          )}
        </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
