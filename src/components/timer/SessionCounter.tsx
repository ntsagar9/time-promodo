import { useEffectiveSettings } from '@/stores/settingsStore'

export function SessionCounter({ completedInCycle }: { completedInCycle: number }): JSX.Element {
  const settings = useEffectiveSettings()
  const target = settings.timer.sessionsBeforeLongBreak
  if (!settings.appearance.showSessionDots) {
    return <div className="h-6" />
  }
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {Array.from({ length: target }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${
            i < completedInCycle ? 'bg-accent' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  )
}
