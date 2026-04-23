import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { UiTooltip } from '@/components/ui/Tooltip'

export function TimerControls({
  running,
  onStart,
  onPause,
  onSkip,
  onReset
}: {
  running: boolean
  onStart: () => void
  onPause: () => void
  onSkip: () => void
  onReset: () => void
}): JSX.Element {
  const actions = [
    {
      key: 'startpause',
      label: running ? 'Pause' : 'Start',
      tooltip: running ? 'Pause' : 'Start',
      variant: 'primary' as const,
      onClick: running ? onPause : onStart,
      icon: running ? <Pause size={20} /> : <Play size={20} />
    },
    {
      key: 'skip',
      label: 'Skip',
      tooltip: 'Skip phase',
      variant: 'ghost' as const,
      onClick: onSkip,
      icon: <SkipForward size={20} />
    },
    {
      key: 'reset',
      label: 'Reset',
      tooltip: 'Reset session',
      variant: 'ghost' as const,
      onClick: onReset,
      icon: <RotateCcw size={20} />
    }
  ]

  return (
    <div className="mt-6 flex items-start justify-center gap-4">
      {actions.map((a) => (
        <div key={a.key} className="flex flex-col items-center gap-1">
          <UiTooltip label={a.tooltip}>
            <Button variant={a.variant} className="h-12 w-12 rounded-2xl px-0" onClick={a.onClick}>
              {a.icon}
            </Button>
          </UiTooltip>
          <span className="text-[11px] text-muted">{a.label}</span>
        </div>
      ))}
    </div>
  )
}
