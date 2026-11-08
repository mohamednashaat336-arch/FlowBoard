import { useCallback, useEffect, useMemo } from 'react'
import useLocalStorage from '../hooks/useLocalStorage.js'
import ThemeContext from './themeContextValue.js'

const VALID_THEMES = new Set(['light', 'dark'])

function updateThemeDom(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.setAttribute('data-bs-theme', theme)
  document.documentElement.style.colorScheme = theme
  if (document.body) {
    document.body.setAttribute('data-theme', theme)
  }
  const themeColor = theme === 'dark' ? '#111827' : '#F5F7FA'
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', themeColor)
}

export function ThemeProvider({ children }) {
  const [storedTheme, setStoredTheme] = useLocalStorage('flowboard-theme', 'light')
  const theme = VALID_THEMES.has(storedTheme) ? storedTheme : 'light'

  useEffect(() => {
    updateThemeDom(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setStoredTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }, [setStoredTheme])

  const setTheme = useCallback((nextTheme) => {
    if (VALID_THEMES.has(nextTheme)) setStoredTheme(nextTheme)
  }, [setStoredTheme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
