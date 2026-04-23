import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'no-drag w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none ring-accent/40 focus:ring-2',
          className
        )}
        {...props}
      />
    )
  }
)
