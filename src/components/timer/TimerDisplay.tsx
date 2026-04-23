import { format } from 'date-fns'
import { motion } from 'framer-motion'
import type { AccentId } from '@/lib/schemas'

const accentTextColor: Record<AccentId, string> = {
  tomato: 'hsl(9 90% 52%)',
  ocean: 'hsl(204 90% 48%)',
  forest: 'hsl(152 60% 38%)',
  sunset: 'hsl(28 95% 50%)',
  purple: 'hsl(270 80% 58%)',
  pink: 'hsl(330 85% 58%)'
}
const accentTextShadow: Record<AccentId, string> = {
  tomato: '0 2px 12px rgba(229, 76, 76, 0.24)',
  ocean: '0 2px 12px rgba(59, 130, 246, 0.24)',
  forest: '0 2px 12px rgba(45, 201, 180, 0.24)',
  sunset: '0 2px 12px rgba(249, 115, 22, 0.24)',
  purple: '0 2px 12px rgba(166, 95, 255, 0.25)',
  pink: '0 2px 12px rgba(236, 72, 153, 0.24)'
}

export function TimerDisplay({
  seconds,
  color
}: {
  seconds: number
  color: AccentId
}): JSX.Element {
  const d = new Date(seconds * 1000)
  const text = format(d, 'mm:ss')
  return (
    <motion.div
      key={text}
      initial={{ opacity: 0.4, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="-mt-2 text-center text-7xl font-bold tracking-[-0.03em] md:text-8xl"
      style={{
        color: accentTextColor[color] ?? 'hsl(var(--accent))',
        textShadow: accentTextShadow[color] ?? accentTextShadow.tomato
      }}
    >
      {text}
    </motion.div>
  )
}
