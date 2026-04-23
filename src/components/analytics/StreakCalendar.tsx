import { useMemo } from 'react'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { eachDayOfInterval, format, subDays } from 'date-fns'

export function StreakCalendar(): JSX.Element {
  const sessions = useAnalyticsStore((s) => s.sessions)
  const days = useMemo(() => {
    const end = new Date()
    const start = subDays(end, 89)
    return eachDayOfInterval({ start, end }).map((d) => {
      const key = d.toDateString()
      const count = sessions.filter(
        (r) => new Date(r.endedAt).toDateString() === key && r.phase === 'work'
      ).length
      const intensity = count === 0 ? 0 : count === 1 ? 1 : count < 4 ? 2 : 3
      return { key, intensity, label: format(d, 'd') }
    })
  }, [sessions])
  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d) => (
        <div
          key={d.key}
          title={d.key}
          className={`flex h-3 w-3 items-center justify-center rounded-sm text-[6px] text-transparent ${
            d.intensity === 0
              ? 'bg-white/5'
              : d.intensity === 1
                ? 'bg-accent/40'
                : d.intensity === 2
                  ? 'bg-accent/70'
                  : 'bg-accent'
          }`}
        >
          {d.label}
        </div>
      ))}
    </div>
  )
}
