import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { AccentId } from '@/lib/schemas'

const accentHue: Record<AccentId, string> = {
  tomato: 'hsl(9 90% 58%)',
  ocean: 'hsl(204 94% 55%)',
  forest: 'hsl(152 60% 42%)',
  sunset: 'hsl(28 95% 55%)',
  purple: 'hsl(270 80% 65%)',
  pink: 'hsl(330 85% 62%)'
}
const accentGlow: Record<AccentId, string> = {
  tomato: 'rgba(232, 93, 76, 0.42)',
  ocean: 'rgba(59, 130, 246, 0.42)',
  forest: 'rgba(34, 197, 94, 0.42)',
  sunset: 'rgba(249, 115, 22, 0.42)',
  purple: 'rgba(168, 85, 247, 0.42)',
  pink: 'rgba(236, 72, 153, 0.42)'
}

export function TimerRing({
  totalSeconds,
  remainingSeconds,
  running,
  color
}: {
  totalSeconds: number
  remainingSeconds: number
  running: boolean
  color: AccentId
}): JSX.Element {
  const r = 120
  const c = 2 * Math.PI * r
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0
  const offset = useMemo(() => c * (1 - progress), [c, progress])
  const stroke = accentHue[color] ?? 'hsl(var(--accent))'
  const glow = accentGlow[color] ?? 'rgba(232, 93, 76, 0.42)'

  return (
    <svg width={300} height={300} viewBox="0 0 300 300" className="mx-auto overflow-visible">
      <motion.circle
        key={`glow-${color}`}
        cx="150"
        cy="150"
        r={r + 8}
        fill="none"
        stroke={stroke}
        strokeWidth="24"
        initial={false}
        animate={{ opacity: running ? 0.6 : 0.25, scale: running ? 1.015 : 1 }}
        transition={{
          opacity: { duration: 0.5, ease: 'easeOut' },
          scale: { duration: running ? 1.8 : 0.4, ease: 'easeInOut', repeat: running ? Infinity : 0, repeatType: 'mirror' }
        }}
        style={{ filter: `drop-shadow(0 0 14px ${glow}) blur(6px)` }}
      />
      <circle cx="150" cy="150" r={r} stroke="white" strokeOpacity={0.08} strokeWidth="14" fill="none" />
      <motion.circle
        key={`ring-${color}`}
        cx="150"
        cy="150"
        r={r}
        stroke={stroke}
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={false}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: running ? 1 : 0.25, ease: 'linear' }}
        transform="rotate(-90 150 150)"
        style={{ filter: `drop-shadow(0 0 12px ${glow})` }}
      />
    </svg>
  )
}
