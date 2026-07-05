import { useConfig } from '@/contexts/config'

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
        <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
          <span className='text-xl'>Oxlint Config Inspector</span>
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
