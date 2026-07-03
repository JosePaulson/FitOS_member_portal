import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'fitos_theme'
const VALID = ['dark', 'light']

/**
 * Reads the user's saved theme preference from localStorage.
 * Falls back to their OS preference, then to 'dark'.
 */
function getInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && VALID.includes(saved)) return saved

  // Respect OS preference if no saved choice
  // if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

/**
 * Applies theme to <html> without triggering a CSS transition flash.
 */
function applyTheme(theme) {
  const html = document.documentElement

  // Suppress transitions momentarily to prevent flash on initial load
  html.classList.add('no-transition')
  html.setAttribute('data-theme', theme)
  // Re-enable transitions after next paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => html.classList.remove('no-transition'))
  })
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const t = getInitialTheme()
    applyTheme(t)
    return t
  })

  // Sync on mount (in case SSR or first render skipped state init)
  useEffect(() => {
    applyTheme(theme)
  }, [])

  const setTheme = useCallback((newTheme) => {
    if (!VALID.includes(newTheme)) return
    applyTheme(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    setThemeState(newTheme)
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggle, isDark: theme === 'dark' }
}
