import { createFileRoute } from '@tanstack/react-router'

import { KeyValue } from '@/components/key-value'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { useConfig } from '@/contexts/config'

export const Route = createFileRoute('/overview')({
  component: RouteComponent,
})

function RouteComponent() {
  const { config } = useConfig()
  const { stats, pluginErrors, configFiles, configFilepath, generatedAt, plugins } = config

  return (
    <TabsContent value='overview'>
      <div className='grid gap-4'>
        <section className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <MetricCard label='Total rules' value={stats.totalRules} />
          <MetricCard label='Enabled rules' value={stats.enabledRules} />
          <MetricCard label='Configured rules' value={stats.configuredRules} />
          <MetricCard label='Override rules' value={stats.overrideRules} />
          <MetricCard label='Builtin rules' value={stats.builtinRules} />
          <MetricCard label='JS plugin rules' value={stats.jsPluginRules} />
          <MetricCard label='Recommended' value={stats.recommendedRules} />
          <MetricCard label='Fixable' value={stats.fixableRules} />
          <MetricCard label='Unknown rules' value={stats.unknownRules} />
          <MetricCard label='Deprecated' value={stats.deprecatedRules} />
          <MetricCard label='Plugin errors' value={pluginErrors.length} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Config</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-3'>
            <KeyValue label='File' value={configFilepath} />
            <KeyValue label='Generated' value={generatedAt} />
            <KeyValue label='Config files' value={String(configFiles.length)} />
            <KeyValue label='Plugins' value={String(plugins.length)} />
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  )
}

type MetricCardProps = {
  label: string
  value: number
}

function MetricCard(props: MetricCardProps) {
  const { label, value } = props

  return (
    <Card size='sm'>
      <CardHeader>
        <CardTitle className='text-muted-foreground'>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='font-mono text-2xl font-medium'>{value}</div>
      </CardContent>
    </Card>
  )
}
