import * as React from 'react'
import { applyStoredPreset } from '@/lib/theme'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'ps-theme-mode'

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  resolved: 'light' | 'dark'
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function isDark(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && systemPrefersDark())
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ThemeMode>(
    // Dark por padrao (workspace Design Engineer). O usuario pode trocar.
    () => (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'dark',
  )

  React.useEffect(() => {
    const dark = isDark(mode)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    // theme-color casa a UI do browser/janela com a página (Vercel guidelines).
    // Hex fixo por tema (o bg computado vem em oklch, inválido na meta tag).
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', dark ? '#0b0b0e' : '#fafafa')
  }, [mode])

  // Reaplica o preset de cores salvo (Temas) ao carregar/qualquer rota.
  React.useEffect(() => {
    applyStoredPreset()
  }, [])

  // Reage à mudança do tema do SO quando o modo é "system".
  React.useEffect(() => {
    if (mode !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () =>
      document.documentElement.classList.toggle('dark', mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [mode])

  const setMode = React.useCallback((next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, next)
    setModeState(next)
  }, [])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ mode, setMode, resolved: isDark(mode) ? 'dark' : 'light' }),
    [mode, setMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>')
  return ctx
}
