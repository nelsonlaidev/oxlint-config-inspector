import type { InspectedRule, InspectedRuleUsageSeverity } from '@oxlint-config-inspector/core'
import type { RulePluginFilter, RuleStateFilter, RuleUsageFilter } from '../types'

import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircleIcon,
  CircleSlashIcon,
  SearchIcon,
  SquareCheckIcon,
  TriangleAlertIcon,
  WrenchIcon,
  XIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { MutedText } from '@/components/muted-text'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useConfig } from '@/contexts/config'
import { filterRules, RULE_STATE_FILTERS, RULE_USAGE_FILTERS } from '@/lib/filters'
import { useInspectorStore } from '@/stores/inspector'

export const Route = createFileRoute('/rules')({
  component: RouteComponent,
})

const DEFAULT_PLUGIN_FILTER: RulePluginFilter = 'all'
const DEFAULT_USAGE_FILTER: RuleUsageFilter = 'using'
const DEFAULT_STATE_FILTER: RuleStateFilter = 'active'

function RouteComponent() {
  const { config } = useConfig()

  const [query, setQuery] = useState('')

  const setSelectedRule = useInspectorStore((state) => state.setSelectedRule)
  const [pluginFilter, setPluginFilter] = useState<RulePluginFilter>(DEFAULT_PLUGIN_FILTER)
  const [usageFilter, setUsageFilter] = useState<RuleUsageFilter>(DEFAULT_USAGE_FILTER)
  const [stateFilter, setStateFilter] = useState<RuleStateFilter>(DEFAULT_STATE_FILTER)

  const hasActiveFilters =
    query.length > 0 ||
    pluginFilter !== DEFAULT_PLUGIN_FILTER ||
    usageFilter !== DEFAULT_USAGE_FILTER ||
    stateFilter !== DEFAULT_STATE_FILTER

  const clearFilters = () => {
    setQuery('')
    setPluginFilter(DEFAULT_PLUGIN_FILTER)
    setUsageFilter(DEFAULT_USAGE_FILTER)
    setStateFilter(DEFAULT_STATE_FILTER)
  }

  const filteredRules = useMemo(
    () =>
      filterRules(config.rules, {
        pluginFilter,
        query,
        stateFilter,
        usageFilter,
      }),
    [config.rules, pluginFilter, query, stateFilter, usageFilter],
  )

  return (
    <TabsContent value='rules'>
      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <InputGroup>
            <InputGroupInput
              placeholder='Search rule, plugin, category, alias'
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
              }}
            />
            <InputGroupAddon align='inline-start'>
              <SearchIcon className='text-muted-foreground' />
            </InputGroupAddon>
          </InputGroup>

          <div className='space-y-3'>
            <RuleFilterGroup
              label='Plugins'
              selectedValue={pluginFilter}
              values={config.rulePluginFilters}
              onValueChange={setPluginFilter}
            />
            <RuleFilterGroup
              label='Usage'
              selectedValue={usageFilter}
              values={RULE_USAGE_FILTERS}
              onValueChange={setUsageFilter}
            />
            <RuleFilterGroup
              label='State'
              selectedValue={stateFilter}
              values={RULE_STATE_FILTERS}
              onValueChange={setStateFilter}
            />
          </div>

          <div className='flex min-h-6 flex-wrap items-center gap-2'>
            <MutedText>
              Showing {filteredRules.length} of {config.stats.totalRules} rules
            </MutedText>
            {hasActiveFilters ? (
              <Button size='xs' variant='ghost' onClick={clearFilters}>
                <XIcon />
                Clear Filter
              </Button>
            ) : null}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-24'>Status</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead className='w-24'>Meta</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length > 0 ? (
                filteredRules.map((rule) => (
                  <TableRow
                    key={rule.ruleId}
                    className='cursor-pointer'
                    tabIndex={0}
                    onClick={() => {
                      setSelectedRule(rule.ruleId)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setSelectedRule(rule.ruleId)
                      }
                    }}
                  >
                    <TableCell>
                      <RuleUsageIcons rule={rule} />
                    </TableCell>
                    <TableCell className='font-mono'>{rule.ruleId}</TableCell>
                    <TableCell>
                      <RuleMetaIcons rule={rule} />
                    </TableCell>
                    <TableCell className='max-w-md text-muted-foreground'>
                      <div className='line-clamp-2'>{rule.description ?? rule.category ?? '-'}</div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className='h-24 text-center text-muted-foreground' colSpan={4}>
                    No rules match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  )
}

type RuleFilterGroupProps<TValue extends string> = {
  label: string
  selectedValue: TValue
  values: readonly TValue[]
  onValueChange: (value: TValue) => void
}

function RuleFilterGroup<TValue extends string>(props: RuleFilterGroupProps<TValue>) {
  const { label, onValueChange, selectedValue, values } = props

  return (
    <div className='grid gap-2 sm:grid-cols-[3rem_1fr] sm:items-start'>
      <div className='leading-7 text-muted-foreground'>{label}</div>
      <div className='flex flex-wrap gap-1.5'>
        {values.map((value) => (
          <RuleFilterChip
            key={value}
            active={value === selectedValue}
            type='button'
            onClick={() => {
              onValueChange(value)
            }}
          >
            {value}
          </RuleFilterChip>
        ))}
      </div>
    </div>
  )
}

type RuleFilterChipProps = {
  active?: boolean
} & React.ComponentProps<typeof Button>

function RuleFilterChip(props: RuleFilterChipProps) {
  const { active = false, children, ...buttonProps } = props

  return (
    <Button size='sm' variant={active ? 'default' : 'outline'} {...buttonProps}>
      {children}
    </Button>
  )
}

type RuleUsageIconsProps = {
  rule: InspectedRule
}

function RuleUsageIcons(props: RuleUsageIconsProps) {
  const { rule } = props

  return (
    <div className='flex min-h-4 items-center gap-1'>
      {rule.severityStates.map((severity) => (
        <RuleUsageIcon key={severity} severity={severity} />
      ))}
    </div>
  )
}

type RuleUsageIconProps = {
  severity: InspectedRuleUsageSeverity
}

function RuleUsageIcon(props: RuleUsageIconProps) {
  const { severity } = props

  if (severity === 'error') {
    return <AlertCircleIcon className='size-4 text-destructive' aria-label='error' />
  }

  if (severity === 'warn') {
    return <TriangleAlertIcon className='size-4 text-warning' aria-label='warn' />
  }

  return <CircleSlashIcon className='size-4 text-muted-foreground' aria-label='off' />
}

type RuleMetaIconsProps = {
  rule: InspectedRule
}

function RuleMetaIcons(props: RuleMetaIconsProps) {
  const { rule } = props

  return (
    <div className='flex items-center gap-1 text-muted-foreground *:size-4'>
      {rule.recommended ? (
        <Tooltip>
          <TooltipTrigger>
            <SquareCheckIcon aria-label='Recommended' className='size-4' />
          </TooltipTrigger>
          <TooltipContent>
            <p>Recommended</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <div />
      )}
      {rule.fixable ? (
        <Tooltip>
          <TooltipTrigger>
            <WrenchIcon aria-label='Fixable' className='size-4' />
          </TooltipTrigger>
          <TooltipContent>
            <p>Fixable</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <div />
      )}
    </div>
  )
}
