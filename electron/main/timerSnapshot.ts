import type { TimerPhase, TimerRunState } from '../../src/types/timer'

export interface PublicTimerSnapshot {
  phase: TimerPhase
  runState: TimerRunState
  remainingSeconds: number
  presetId: string
}

let snapshot: PublicTimerSnapshot = {
  phase: 'work',
  runState: 'idle',
  remainingSeconds: 25 * 60,
  presetId: 'builtin-classic'
}

export function setPublicTimerSnapshot(next: PublicTimerSnapshot): void {
  snapshot = next
}

export function getPublicTimerSnapshot(): PublicTimerSnapshot {
  return snapshot
}
