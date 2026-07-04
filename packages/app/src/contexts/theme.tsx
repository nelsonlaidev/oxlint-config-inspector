import type { ReactNode } from 'react'

import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = 'dark' | 'light'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeContextValue = {
  setTheme: (theme: Theme) => void
  theme: Theme
}

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)'
const THEME_VALUES = new Set<Theme>(['dark', 'light', 'system'])

const ThemeContext = createContext<ThemeContextValue | null>(null)
ThemeContext.displayName = 'ThemeProviderContext'

function isTheme(value: string | null): value is Theme {
  if (value === null) {
    return false
  }

  return THEME_VALUES.has(value as Theme)
}

function getSystemTheme(): ResolvedTheme {
  if (globalThis.matchMedia(COLOR_SCHEME_QUERY).matches) {
    return 'dark'
  }

  return 'light'
}

export const useTheme = () => {
  const context = use(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider />')
  }

  return context
}

export function ThemeProvider(props: ThemeProviderProps) {
  const { children, defaultTheme = 'system', storageKey = 'theme' } = props

  const [themeState, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey)

    if (isTheme(storedTheme)) {
      return storedTheme
    }

    return defaultTheme
  })

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      localStorage.setItem(storageKey, nextTheme)
      setThemeState(nextTheme)
    },
    [storageKey],
  )

  useEffect(() => {
    const resolvedTheme = themeState === 'system' ? getSystemTheme() : themeState
    const root = document.documentElement

    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)

    if (themeState !== 'system') {
      return
    }

    const mediaQuery = globalThis.matchMedia(COLOR_SCHEME_QUERY)
    const handleChange = () => {
      const newResolvedTheme = getSystemTheme()
      root.classList.remove('light', 'dark')
      root.classList.add(newResolvedTheme)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [themeState])

  const value = useMemo(
    () => ({
      setTheme,
      theme: themeState,
    }),
    [setTheme, themeState],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
