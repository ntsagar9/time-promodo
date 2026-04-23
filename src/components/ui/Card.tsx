import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-surface/70 p-4 shadow-glass backdrop-blur-xl',
        className
      )}
      {...props}
    />
  )
}
