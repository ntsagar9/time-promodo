/**
 * 0–100 score for a given day.
 * Formula:
 *   base = (completedSessions / dailyTarget) * 70
 *   consistency = streakDays > 1 ? min(streakDays * 2, 20) : 0
 *   quality = avgSessionCompletionRate * 10
 * Total = min(base + consistency + quality, 100)
 */
// DONE
export interface FocusScoreParams {
  completedSessionsToday: number
  dailyTarget: number
  streakDays: number
  /** 0–1 average completion (1 = no early skips tracked) */
  avgSessionCompletionRate: number
}

export function calculateFocusScore(params: FocusScoreParams): number {
  const { completedSessionsToday, dailyTarget, streakDays, avgSessionCompletionRate } =
    params
  const base = Math.min(70, (completedSessionsToday / Math.max(1, dailyTarget)) * 70)
  const consistency = streakDays > 1 ? Math.min(streakDays * 2, 20) : 0
  const quality = Math.min(10, Math.max(0, avgSessionCompletionRate) * 10)
  return Math.min(100, Math.round(base + consistency + quality))
}
