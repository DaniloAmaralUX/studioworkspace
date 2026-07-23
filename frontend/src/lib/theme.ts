import type { ThemePreset } from './themePresets'

// Preset de tema (cores) aplicado por cima do index.css, via um <style> injetado.
// Guardamos o CSS já pronto no localStorage para reaplicar em qualquer rota/reload.

export const PRESET_KEY = 'ps-theme-preset'
const STYLE_ID = 'ps-theme-preset-vars'

export function presetToCss(preset: ThemePreset): string {
  const block = (selector: string, vars: Record<string, string>) => {
    const body = Object.entries(vars)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join('\n')
    return `${selector} {\n${body}\n}`
  }
  return `${block(':root', preset.light)}\n${block('.dark', preset.dark)}`
}

export function applyPresetCss(css: string | null) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!css) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}

export function storePreset(preset: ThemePreset) {
  const css = presetToCss(preset)
  localStorage.setItem(PRESET_KEY, JSON.stringify({ name: preset.name, css }))
  applyPresetCss(css)
}

export function clearPreset() {
  localStorage.removeItem(PRESET_KEY)
  applyPresetCss(null)
}

export function getStoredPresetName(): string | null {
  try {
    const raw = localStorage.getItem(PRESET_KEY)
    return raw ? (JSON.parse(raw).name as string) : null
  } catch {
    return null
  }
}

export function applyStoredPreset() {
  try {
    const raw = localStorage.getItem(PRESET_KEY)
    if (raw) applyPresetCss(JSON.parse(raw).css as string)
  } catch {
    /* ignora localStorage corrompido */
  }
}
