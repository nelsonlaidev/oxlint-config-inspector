import type { ReactNode } from 'react'

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = 'dark' | 'light'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeContextValue = {
  resolvedTheme: ResolvedTheme
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

function disableTransitionsTemporarily() {
  const style = document.createElement('style')

  style.append(
    document.createTextNode('*,*::before,*::after{-webkit-transition:none!important;transition:none!important}'),
  )
  document.head.append(style)

  return () => {
    globalThis.getComputedStyle(document.body).getPropertyValue('opacity')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove()
      })
    })
  }
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
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())
  const resolvedTheme = themeState === 'system' ? systemTheme : themeState
  const hasAppliedThemeRef = useRef(false)

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      localStorage.setItem(storageKey, nextTheme)
      setThemeState(nextTheme)
    },
    [storageKey],
  )

  useEffect(() => {
    const root = document.documentElement
    const restoreTransitions = hasAppliedThemeRef.current ? disableTransitionsTemporarily() : undefined

    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
    hasAppliedThemeRef.current = true
    restoreTransitions?.()
  }, [resolvedTheme])

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia(COLOR_SCHEME_QUERY)
    const handleChange = () => {
      setSystemTheme(getSystemTheme())
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const value = useMemo(
    () => ({
      resolvedTheme,
      setTheme,
      theme: themeState,
    }),
    [resolvedTheme, setTheme, themeState],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
