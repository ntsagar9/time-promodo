import { motion } from 'framer-motion'
import type { TimerPhase } from '@/types/timer'

const labels: Record<TimerPhase, string> = {
  work: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break'
}

export function PhaseIndicator({ phase }: { phase: TimerPhase }): JSX.Element {
  return (
    <motion.div
      key={phase}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center text-sm uppercase tracking-[0.2em] text-muted"
    >
      {labels[phase]}
    </motion.div>
  )
}
