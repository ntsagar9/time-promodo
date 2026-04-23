import { useMemo } from 'react'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useEffectiveSettings } from '@/stores/settingsStore'

export function useAnalyticsSummary(): {
  today: number
  target: number
  streak: number
  weekMinutes: number
} {
  const sessions = useAnalyticsStore((s) => s.sessions)
  const settings = useEffectiveSettings()
  return useMemo(() => {
    const todayKey = new Date().toDateString()
    const today = sessions.filter(
      (r) => new Date(r.endedAt).toDateString() === todayKey && r.phase === 'work'
    ).length
    const weekAgo = Date.now() - 7 * 86400000
    const weekMinutes = Math.round(
      sessions
        .filter((r) => new Date(r.endedAt).getTime() >= weekAgo && r.phase === 'work')
        .reduce((acc, r) => acc + r.durationSeconds, 0) / 60
    )
    const days = new Set(
      sessions
        .filter((r) => r.phase === 'work')
        .map((r) => new Date(r.endedAt).toDateString())
    )
    let streak = 0
    const anchor = new Date()
    for (let i = 0; i < 400; i++) {
      const d = new Date(anchor)
      d.setDate(anchor.getDate() - i)
      const key = d.toDateString()
      if (days.has(key)) {
        streak++
      } else if (i === 0) {
        continue
      } else {
        break
      }
    }
    return {
      today,
      target: settings.timer.dailySessionTarget,
      streak,
      weekMinutes
    }
  }, [sessions, settings.timer.dailySessionTarget])
}
