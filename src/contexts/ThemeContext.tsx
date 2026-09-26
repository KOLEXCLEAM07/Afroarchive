import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { getStorageItem, setStorageItem } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme:       Theme
  isDark:      boolean
  setTheme:    (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => getStorageItem<Theme>('theme', 'system')
  )

  const applyTheme = useCallback((t: Theme) => {
    const dark = t === 'dark' || (t === 'system' && getSystemDark())
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  useEffect(() => {
    applyTheme(theme)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (theme === 'system') applyTheme('system') }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [theme, applyTheme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    setStorageItem('theme', t)
  }

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'light' : 'dark')
  }

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && getSystemDark())

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
