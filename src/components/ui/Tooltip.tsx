import * as Tooltip from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

export function UiTooltip({
  label,
  children
}: {
  label: string
  children: ReactNode
}): JSX.Element {
  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="rounded-lg bg-black/80 px-2 py-1 text-xs text-white shadow">
          {label}
          <Tooltip.Arrow className="fill-black/80" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
