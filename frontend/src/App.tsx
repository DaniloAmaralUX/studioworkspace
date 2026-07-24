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
        </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
