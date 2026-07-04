import type { InspectorTab } from '../types'

import { Link, useLocation } from '@tanstack/react-router'

import { ConfigProvider } from '@/contexts/config'
import { useConfigLoader } from '@/hooks/use-config-loader'

import { Header } from './header'
import { RuleDetailSheet } from './rule-detail-sheet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Spinner } from './ui/spinner'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

function getActiveTab(pathname: string): InspectorTab {
  const segment = pathname.split('/').find(Boolean)

  if (TAB_VALUES.has(segment as InspectorTab)) {
    return segment as InspectorTab
  }

  return 'overview'
}

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'rules', label: 'Rules' },
  { value: 'overrides', label: 'Overrides' },
  { value: 'plugins', label: 'Plugins' },
  { value: 'config-files', label: 'Config Files' },
] as const

const TAB_VALUES = new Set(TABS.map((tab) => tab.value))

type InspectorProps = {
  children: React.ReactNode
}

export function Inspector(props: InspectorProps) {
  const { children } = props
  const { status, data, message } = useConfigLoader()
  const location = useLocation()
  const activeTab = getActiveTab(location.pathname)

  if (status === 'loading') {
    return (
      <main className='flex min-h-screen items-center justify-center gap-2'>
        <Spinner />
        Loading Config...
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className='flex min-h-screen items-center justify-center px-4'>
        <Card className='w-full max-w-2xl'>
          <CardHeader>
            <CardTitle>Could not load config</CardTitle>
            <CardDescription>Start the inspector from a directory with an Oxlint config.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <p>Command</p>
              <pre className='bg-secondary px-3 py-2'>
                <code>oxlint-config-inspector dev</code>
              </pre>
            </div>
            <div className='space-y-2'>
              <p>Error Message</p>
              <pre className='bg-secondary px-3 py-2'>
                <code>{message}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <ConfigProvider value={{ config: data }}>
      <main className='min-h-screen space-y-4 px-4 pt-6 pb-12'>
        <Header />

        <Tabs className='mx-auto max-w-7xl gap-3' value={activeTab}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                nativeButton={false}
                render={<Link to={`/${tab.value}`}>{tab.label}</Link>}
              />
            ))}
          </TabsList>

          {children}
        </Tabs>

        <RuleDetailSheet />
      </main>
    </ConfigProvider>
  )
}
