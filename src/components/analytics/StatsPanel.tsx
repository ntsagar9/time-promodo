import { Card } from '@/components/ui/Card'
import { useAnalyticsSummary } from '@/hooks/useAnalytics'
import { DailyChart } from '@/components/analytics/DailyChart'
import { WeeklyChart } from '@/components/analytics/WeeklyChart'
import { StreakCalendar } from '@/components/analytics/StreakCalendar'
import { Button } from '@/components/ui/Button'

export function StatsPanel(): JSX.Element {
  const summary = useAnalyticsSummary()
  return (
    <div className="space-y-4">
      <Card>
        <div className="text-xs uppercase tracking-widest text-muted">Today</div>
        <div className="mt-2 text-3xl font-semibold">
          {summary.today}/{summary.target}
        </div>
        <p className="mt-1 text-xs text-muted">sessions toward your daily goal</p>
      </Card>
      <Card>
        <div className="text-xs text-muted">Streak</div>
        <div className="text-2xl font-semibold">{summary.streak} days</div>
      </Card>
      <Card>
        <div className="text-xs text-muted">Last 7 days (minutes)</div>
        <div className="mt-4 h-40">
          <DailyChart />
        </div>
      </Card>
      <Card>
        <div className="text-xs text-muted">Weekly focus (minutes)</div>
        <div className="mt-4 h-40">
          <WeeklyChart />
        </div>
      </Card>
      <Card>
        <div className="text-xs text-muted">Activity</div>
        <div className="mt-4">
          <StreakCalendar />
        </div>
      </Card>
      <Button
        variant="ghost"
        className="w-full"
        onClick={async () => {
          const res = await window.tpromodo.analytics.export('json')
          if (res.ok) {
            const blob = new Blob([res.data], { type: res.mime })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'timerpromodo-analytics.json'
            a.click()
            URL.revokeObjectURL(url)
          }
        }}
      >
        Export JSON
      </Button>
    </div>
  )
}
