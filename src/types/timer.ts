export type TimerPhase = 'work' | 'shortBreak' | 'longBreak'

export type TimerRunState = 'idle' | 'running' | 'paused'

export type TimerMachineState =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'breakActive'

export interface TimerTickPayload {
  phase: TimerPhase
  runState: TimerRunState
  remainingSeconds: number
  completedWorkSessionsInCycle: number
  dailySessionTarget: number
  todayCompletedSessions: number
  presetId: string
  activeTaskTitle: string | null
  sessionLabel: string | null
  focusScoreToday: number
}

export interface TimerPhaseChangePayload {
  previousPhase: TimerPhase | null
  phase: TimerPhase
  reason: 'manual' | 'complete' | 'skip' | 'preset'
}
