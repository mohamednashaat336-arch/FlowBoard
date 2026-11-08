import { Moon, Sun } from 'lucide-react'
import useTheme from '../../hooks/useTheme.js'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      className={`fb-icon-button ${className}`.trim()}
      onClick={toggleTheme}
      title={`Switch to ${nextTheme} mode`}
      type="button"
    >
      <Icon aria-hidden="true" />
    </button>
  )
}
