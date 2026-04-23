import type { TimerPhase, TimerRunState } from '@/types/timer'
import type { CustomPreset } from '@/types/settings'

export interface EngineSnapshot {
  runState: TimerRunState
  phase: TimerPhase
  remainingSeconds: number
  completedWorkSessionsInCycle: number
}

export function phaseDurationsSeconds(preset: CustomPreset): Record<TimerPhase, number> {
  return {
    work: preset.workMinutes * 60,
    shortBreak: preset.shortBreakMinutes * 60,
    longBreak: preset.longBreakMinutes * 60
  }
}

export function nextPhaseAfterWorkComplete(
  completedInCycle: number,
  sessionsBeforeLong: number
): TimerPhase {
  const nextCount = completedInCycle + 1
  if (nextCount >= sessionsBeforeLong) {
    return 'longBreak'
  }
  return 'shortBreak'
}

export function afterBreakPhase(
  phase: TimerPhase,
  completedInCycle: number,
  _sessionsBeforeLong: number
): { phase: TimerPhase; completedWorkSessionsInCycle: number } {
  if (phase === 'longBreak') {
    return { phase: 'work', completedWorkSessionsInCycle: 0 }
  }
  if (phase === 'shortBreak') {
    return { phase: 'work', completedWorkSessionsInCycle: completedInCycle }
  }
  return { phase: 'work', completedWorkSessionsInCycle: completedInCycle }
}

export function createInitialSnapshot(
  preset: CustomPreset,
  phase: TimerPhase = 'work'
): EngineSnapshot {
  const d = phaseDurationsSeconds(preset)
  return {
    runState: 'idle',
    phase,
    remainingSeconds: d[phase],
    completedWorkSessionsInCycle: 0
  }
}

export function tickSnapshot(snapshot: EngineSnapshot): EngineSnapshot {
  if (snapshot.runState !== 'running' || snapshot.remainingSeconds <= 0) {
    return snapshot
  }
  return {
    ...snapshot,
    remainingSeconds: snapshot.remainingSeconds - 1
  }
}

export function applyPresetToSnapshot(
  snapshot: EngineSnapshot,
  preset: CustomPreset,
  resetCycle: boolean
): EngineSnapshot {
  const d = phaseDurationsSeconds(preset)
  return {
    runState: 'idle',
    phase: 'work',
    remainingSeconds: d.work,
    completedWorkSessionsInCycle: resetCycle ? 0 : snapshot.completedWorkSessionsInCycle
  }
}
