import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { format, subDays } from 'date-fns'

export function DailyChart(): JSX.Element {
  const sessions = useAnalyticsStore((s) => s.sessions)
  const data = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(new Date(), 6 - i)
      const key = day.toDateString()
      const minutes = Math.round(
        sessions
          .filter(
            (r) => new Date(r.endedAt).toDateString() === key && r.phase === 'work'
          )
          .reduce((acc, r) => acc + r.durationSeconds, 0) / 60
      )
      return { label: format(day, 'EEE'), minutes }
    })
  }, [sessions])
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
        <YAxis stroke="#94a3b8" fontSize={10} />
        <Tooltip
          contentStyle={{ background: '#0f172a', borderRadius: 12, border: '1px solid #1e293b' }}
        />
        <Bar dataKey="minutes" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
