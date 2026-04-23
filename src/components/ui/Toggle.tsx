import * as Switch from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

export function Toggle({
  checked,
  onCheckedChange,
  id
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  id?: string
}): JSX.Element {
  return (
    <Switch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'no-drag relative h-6 w-11 cursor-default rounded-full bg-white/10 outline-none data-[state=checked]:bg-accent'
      )}
    >
      <Switch.Thumb
        className={cn(
          'block h-5 w-5 translate-x-0.5 rounded-full bg-white transition will-change-transform data-[state=checked]:translate-x-5'
        )}
      />
    </Switch.Root>
  )
}
