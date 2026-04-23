import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { subWeeks, startOfWeek, format } from 'date-fns'

export function WeeklyChart(): JSX.Element {
  const sessions = useAnalyticsStore((s) => s.sessions)
  const data = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => {
      const start = startOfWeek(subWeeks(new Date(), 3 - i))
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      const minutes = Math.round(
        sessions
          .filter((r) => {
            const t = new Date(r.endedAt).getTime()
            return t >= start.getTime() && t < end.getTime() && r.phase === 'work'
          })
          .reduce((acc, r) => acc + r.durationSeconds, 0) / 60
      )
      return { label: format(start, 'MMM d'), minutes }
    })
  }, [sessions])
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
        <YAxis stroke="#94a3b8" fontSize={10} />
        <Tooltip
          contentStyle={{ background: '#0f172a', borderRadius: 12, border: '1px solid #1e293b' }}
        />
        <Line type="monotone" dataKey="minutes" stroke="hsl(var(--accent))" strokeWidth={3} dot />
      </LineChart>
    </ResponsiveContainer>
  )
}
