import { createContext, useContext } from 'react'
import { useTheme } from '../hooks/useTheme'

const ThemeCtx = createContext(null)

export function ThemeProvider({ children }) {
  const theme = useTheme()
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>
}

export function useThemeContext() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useThemeContext must be inside ThemeProvider')
  return ctx
}
