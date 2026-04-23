import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted',
        className
      )}
      {...props}
    />
  )
}
