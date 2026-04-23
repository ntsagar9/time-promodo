import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

const variants: Record<string, string> = {
  primary:
    'bg-accent text-white hover:brightness-110 active:scale-[0.98] shadow-glass',
  ghost:
    'bg-white/5 hover:bg-white/10 text-foreground active:scale-[0.98]',
  danger:
    'bg-red-500/90 text-white hover:bg-red-500 active:scale-[0.98]'
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }): JSX.Element {
  return (
    <button
      className={cn(
        'no-drag inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition will-change-transform',
        variants[variant],
        className
      )}
      type="button"
      {...props}
    />
  )
}
