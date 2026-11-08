import { useCallback, useEffect, useMemo } from 'react'
import useLocalStorage from '../hooks/useLocalStorage.js'
import ThemeContext from './themeContextValue.js'

const VALID_THEMES = new Set(['light', 'dark'])

export function ThemeProvider({ children }) {
  const [storedTheme, setStoredTheme] = useLocalStorage('flowboard-theme', 'light')
  const theme = VALID_THEMES.has(storedTheme) ? storedTheme : 'light'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
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
