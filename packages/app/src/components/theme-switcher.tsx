import { MoonIcon, SunIcon } from 'lucide-react'

import { useTheme } from '@/contexts/theme'

import { Button } from './ui/button'

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme()
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
  const Icon = resolvedTheme === 'dark' ? SunIcon : MoonIcon

  return (
    <Button
      aria-label={`Switch to ${nextTheme} theme`}
      size='icon'
      type='button'
      variant='outline'
      onClick={() => {
        setTheme(nextTheme)
      }}
    >
      <Icon />
    </Button>
  )
}
