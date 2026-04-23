import * as RadixSlider from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1
}: {
  value: number[]
  onChange: (v: number[]) => void
  min: number
  max: number
  step?: number
}): JSX.Element {
  return (
    <RadixSlider.Root
      className={cn('no-drag relative flex h-6 w-full touch-none select-none items-center')}
      value={value}
      onValueChange={onChange}
      min={min}
      max={max}
      step={step}
    >
      <RadixSlider.Track className="relative h-2 grow rounded-full bg-white/10">
        <RadixSlider.Range className="absolute h-full rounded-full bg-accent" />
      </RadixSlider.Track>
      <RadixSlider.Thumb className="block h-4 w-4 rounded-full bg-white shadow" />
    </RadixSlider.Root>
  )
}
