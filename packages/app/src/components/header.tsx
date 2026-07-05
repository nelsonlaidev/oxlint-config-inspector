import { useConfig } from '@/contexts/config'

import { Logo } from './logo'
import { ThemeSwitcher } from './theme-switcher'

export function Header() {
  const { config } = useConfig()
  const generatedAt = Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(config.generatedAt))

  return (
    <header className='mx-auto max-w-7xl space-y-2'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
          <div className='flex items-center gap-2'>
            <Logo aria-hidden='true' />
            <span className='text-xl'>Oxlint Config Inspector</span>
          </div>
          <span className='font-mono text-muted-foreground'>v{config.version}</span>
        </div>
        <ThemeSwitcher />
      </div>
      <div className='font-mono text-sm text-muted-foreground' title={config.generatedAt}>
        Generated {generatedAt}
      </div>
    </header>
  )
}
