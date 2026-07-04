import type { InspectedOverrideGroup } from '@oxlint-config-inspector/core'
import type { LucideIcon } from 'lucide-react'

import { createFileRoute } from '@tanstack/react-router'
import { EyeClosedIcon, FileSearchIcon, ListIcon, PlugIcon } from 'lucide-react'

import { EmptyCard } from '@/components/empty-card'
import { KeyValue } from '@/components/key-value'
import { MutedText } from '@/components/muted-text'
import { SeverityBadge } from '@/components/severity-badge'
import { SourceBadge } from '@/components/source-badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useConfig } from '@/contexts/config'
import { useInspectorStore } from '@/stores/inspector'
import { cn } from '@/utils/cn'

export const Route = createFileRoute('/overrides')({
  component: RouteComponent,
})

function RouteComponent() {
  const { config } = useConfig()
  const groups = config.overrideGroups

  const setSelectedRule = useInspectorStore((state) => state.setSelectedRule)

  if (groups.length === 0) {
    return <EmptyCard title='Overrides' message='No override configuration was found.' />
  }

  return (
    <TabsContent value='overrides'>
      <div className='grid gap-4'>
        <Accordion>
          {groups.map((group) => (
            <AccordionItem key={group.index} value={`override-${group.index}`}>
              <AccordionTrigger className='items-center'>
                <div className='flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center'>
                  <div className='min-w-0 flex-1 truncate'>Override #{group.index}</div>
                  <OverrideSummaryIcons group={group} />
                </div>
              </AccordionTrigger>
              <AccordionContent className='space-y-3 [--key-value-grid-cols:3.5rem_1fr]'>
                <KeyValue label='Files' value={group.files.join(', ')} />
                {group.excludeFiles ? <KeyValue label='Exclude' value={group.excludeFiles.join(', ')} /> : null}
                {group.plugins?.length ? <KeyValue label='Plugins' value={group.plugins.join(', ')} /> : null}
                {group.rules.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.rules.map((rule) => (
                        <TableRow
                          key={rule.ruleId}
                          className='cursor-pointer'
                          onClick={() => {
                            setSelectedRule(rule.ruleId)
                          }}
                        >
                          <TableCell className='font-mono'>{rule.ruleId}</TableCell>
                          <TableCell>
                            <SeverityBadge severity={rule.severity} />
                          </TableCell>
                          <TableCell>
                            <SourceBadge source={rule.source} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <MutedText>No rules configured for this override.</MutedText>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </TabsContent>
  )
}

type OverrideSummaryIconsProps = {
  group: InspectedOverrideGroup
}

function OverrideSummaryIcons(props: OverrideSummaryIconsProps) {
  const { group } = props

  return (
    <div className='grid shrink-0 grid-cols-4 items-center gap-2'>
      <OverrideSummaryIcon icon={FileSearchIcon} label='Files' tone='text-warning' value={group.files.length} />
      <OverrideSummaryIcon
        icon={EyeClosedIcon}
        label='Exclude files'
        tone='text-violet-500'
        value={group.excludeFiles?.length ?? 0}
      />
      <OverrideSummaryIcon icon={PlugIcon} label='Plugins' tone='text-emerald-500' value={group.plugins?.length ?? 0} />
      <OverrideSummaryIcon icon={ListIcon} label='Rules' tone='text-sky-500' value={group.rules.length} />
    </div>
  )
}

type OverrideSummaryIconProps = {
  icon: LucideIcon
  label: string
  tone: string
  value: number
}

function OverrideSummaryIcon(props: OverrideSummaryIconProps) {
  const { icon: Icon, label, tone, value } = props
  const hasValue = value > 0
  const text = `${value} ${label}`

  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={text}
        className={cn(
          'inline-flex min-w-12 items-center justify-start gap-1.5 text-sm font-semibold',
          hasValue ? tone : 'text-muted-foreground/30',
        )}
        render={<span />}
      >
        <Icon aria-hidden='true' className='size-4' />
        {hasValue ? <span className='font-mono tabular-nums'>{value}</span> : null}
      </TooltipTrigger>
      <TooltipContent>
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}
