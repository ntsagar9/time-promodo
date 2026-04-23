import { useEffect } from 'react'
import { format } from 'date-fns'
import { Play, Pause } from 'lucide-react'
import { useTimerStore } from '@/stores/timerStore'
import { Button } from '@/components/ui/Button'

export function MiniTimerRoot(): JSX.Element {
  const applyTick = useTimerStore((s) => s.applyTick)

  useEffect(() => {
    const off = window.tpromodo.on(window.tpromodo.channels.tick, (raw) => {
      applyTick(raw as never)
    })
    return () => {
      off()
    }
  }, [applyTick])

  const phase = useTimerStore((s) => s.phase)
  const run = useTimerStore((s) => s.runState)
  const remaining = useTimerStore((s) => s.remainingSeconds)
  const text = format(new Date(remaining * 1000), 'mm:ss')

  return (
    <div className="drag flex h-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surface/80 px-3 py-2 text-foreground shadow-glass backdrop-blur-xl">
      <div className="no-drag text-[10px] uppercase tracking-widest text-muted">{phase}</div>
      <div className="no-drag text-lg font-semibold tabular-nums">{text}</div>
      <Button
        className="no-drag h-9 w-9 rounded-xl px-0"
        onClick={() => {
          void (run === 'running' ? window.tpromodo.timer.pause() : window.tpromodo.timer.start())
        }}
      >
        {run === 'running' ? <Pause size={16} /> : <Play size={16} />}
      </Button>
    </div>
  )
}
