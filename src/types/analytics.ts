import type { TimerPhase } from '@/types/timer'

export interface SessionRecord {
  id: string
  endedAt: string
  durationSeconds: number
  phase: TimerPhase
  presetId: string
  presetName: string
  tasksCompleted: string[]
  label: string | null
}

export interface AnalyticsExport {
  exportedAt: string
  schemaVersion: number
  sessions: SessionRecord[]
}
