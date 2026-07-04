import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { cn } from '@/utils/cn'

type AccordionProps = AccordionPrimitive.Root.Props

export function Accordion(props: AccordionProps) {
  const { className, ...rest } = props

  return (
    <AccordionPrimitive.Root data-slot='accordion' className={cn('flex w-full flex-col gap-3', className)} {...rest} />
  )
}

type AccordionItemProps = AccordionPrimitive.Item.Props

export function AccordionItem(props: AccordionItemProps) {
  const { className, ...rest } = props

  return <AccordionPrimitive.Item data-slot='accordion-item' className={cn('border', className)} {...rest} />
}

type AccordionTriggerProps = AccordionPrimitive.Trigger.Props

export function AccordionTrigger(props: AccordionTriggerProps) {
  const { className, children, ...rest } = props

  return (
    <AccordionPrimitive.Header className='flex'>
      <AccordionPrimitive.Trigger
        data-slot='accordion-trigger'
        className={cn(
          'group/accordion-trigger relative flex flex-1 items-start gap-2 rounded-none bg-card px-2 py-2.5 text-left text-sm font-medium transition-all outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground',
          className,
        )}
        {...rest}
      >
        <ChevronDownIcon
          data-slot='accordion-trigger-icon'
          className='pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden'
        />
        <ChevronUpIcon
          data-slot='accordion-trigger-icon'
          className='pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline'
        />
        {children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

type AccordionContentProps = AccordionPrimitive.Panel.Props

export function AccordionContent(props: AccordionContentProps) {
  const { className, children, ...rest } = props

  return (
    <AccordionPrimitive.Panel
      data-slot='accordion-content'
      className='overflow-hidden bg-card px-2 py-4 text-sm data-open:animate-accordion-down data-closed:animate-accordion-up'
      {...rest}
    >
      <div
        className={cn(
          'h-(--accordion-panel-height) pt-0 pb-2.5 data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  )
}
