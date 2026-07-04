import type { InspectedRule } from '@oxlint-config-inspector/core'

import { ExternalLinkIcon, InfoIcon } from 'lucide-react'

import { useConfig } from '@/contexts/config'
import { createRuleUsageConfigs, getUsageLocation } from '@/lib/usage'
import { useInspectorStore } from '@/stores/inspector'
import { cn } from '@/utils/cn'

import { DetailSection } from './detail-section'
import { JsonBlock } from './json-block'
import { KeyValue } from './key-value'
import { MutedText } from './muted-text'
import { SeverityBadge } from './severity-badge'
import { buttonVariants } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export function RuleDetailSheet() {
  const { config } = useConfig()
  const selectedRule = useInspectorStore((state) => state.selectedRule)
  const setSelectedRule = useInspectorStore((state) => state.setSelectedRule)

  const rule = selectedRule ? (config.rules.find((r) => r.ruleId === selectedRule) ?? null) : null
  const usageConfigs = rule ? createRuleUsageConfigs(rule, config.overrideGroups) : []

  return (
    <Sheet
      open={rule !== null}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedRule(null)
        }
      }}
    >
      <SheetContent className='w-full overflow-hidden sm:data-[side=right]:max-w-3xl'>
        {rule ? (
          <>
            <SheetHeader>
              <SheetTitle className='font-mono'>{rule.ruleId}</SheetTitle>
              <SheetDescription>{rule.source}</SheetDescription>
            </SheetHeader>
            <ScrollArea className='min-h-0 flex-1'>
              <div className='space-y-5 px-4 pb-4'>
                {rule.docsUrl ? (
                  <a
                    className={cn(buttonVariants({ size: 'xs', variant: 'outline' }))}
                    href={rule.docsUrl}
                    rel='noreferrer noopener'
                    target='_blank'
                  >
                    Docs
                    <ExternalLinkIcon data-icon='inline-end' />
                  </a>
                ) : null}

                <Separator />

                <DetailSection title='Details'>
                  <KeyValue label='Name' value={rule.name} />
                  <KeyValue label='Plugin' value={rule.pluginName ?? '-'} />
                  <KeyValue label='Description' value={rule.description ?? '-'} />
                  <KeyValue label='Type/Category' value={rule.ruleType ?? rule.category ?? '-'} />
                  <KeyValue label='Recommended' value={String(rule.recommended)} />
                  <KeyValue label='Fixable' value={String(rule.fixable)} />
                  <KeyValue label={<TypeAwareLabel />} value={getTypeAwareValue(rule)} />
                  <KeyValue label='Has suggestions' value={String(rule.hasSuggestions)} />
                  <KeyValue label='Deprecated' value={String(rule.deprecated)} />
                  <KeyValue label='Replaced by' value={rule.replacedBy.length > 0 ? rule.replacedBy.join(', ') : '-'} />
                  <KeyValue label='Used' value={String(rule.used)} />
                  <KeyValue label='Overloaded' value={String(rule.overloaded)} />
                  <KeyValue label='Aliases' value={rule.aliases.length > 0 ? rule.aliases.join(', ') : '-'} />
                </DetailSection>

                <Separator />

                <DetailSection title='Usage'>
                  {usageConfigs.length > 0 ? (
                    <div className='space-y-3'>
                      {usageConfigs.map((config) => (
                        <Card key={`${config.source}-${config.index ?? 'root'}-${config.ruleId}`} size='sm'>
                          <CardHeader>
                            <CardTitle className='flex flex-wrap items-center gap-2'>
                              <span>Set to</span>
                              <SeverityBadge severity={config.severity} />
                              <span>in {getUsageLocation(config)}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className='space-y-2'>
                            {config.files ? <KeyValue label='Files' value={config.files.join(', ')} /> : null}
                            {config.excludeFiles ? (
                              <KeyValue label='Exclude' value={config.excludeFiles.join(', ')} />
                            ) : null}
                            {config.files ? null : <MutedText>Applied generally for all files.</MutedText>}
                            {config.options.length > 0 ? (
                              <div className='space-y-2'>
                                <div className='text-muted-foreground'>Rule options</div>
                                {config.options.map((option, index) => (
                                  // oxlint-disable-next-line @eslint-react/no-array-index-key
                                  <JsonBlock key={index} value={option} />
                                ))}
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <MutedText>No default, root, or override usage config applies to this rule.</MutedText>
                  )}
                </DetailSection>
              </div>
            </ScrollArea>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function TypeAwareLabel() {
  return (
    <span className='inline-flex items-center gap-1.5'>
      <span>Type aware</span>
      <Tooltip>
        <TooltipTrigger className='inline-flex text-muted-foreground hover:text-foreground'>
          <InfoIcon aria-label='Type aware info' className='size-3.5' />
        </TooltipTrigger>
        <TooltipContent>
          <p>Whether this rule requires type information. Unknown means the rule metadata does not expose it.</p>
        </TooltipContent>
      </Tooltip>
    </span>
  )
}

function getTypeAwareValue(rule: InspectedRule) {
  if (rule.typeAware === undefined) {
    return 'unknown'
  }

  return String(rule.typeAware)
}
