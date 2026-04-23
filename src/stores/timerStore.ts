import { create } from 'zustand'
import type { TimerPhase, TimerRunState } from '@/types/timer'

export interface TimerTickState {
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

interface TimerStore extends TimerTickState {
  applyTick: (payload: TimerTickState) => void
}

const defaultState: TimerTickState = {
  phase: 'work',
  runState: 'idle',
  remainingSeconds: 25 * 60,
  completedWorkSessionsInCycle: 0,
  dailySessionTarget: 8,
  todayCompletedSessions: 0,
  presetId: 'builtin-classic',
  activeTaskTitle: null,
  sessionLabel: null,
  focusScoreToday: 0
}

export const useTimerStore = create<TimerStore>((set) => ({
  ...defaultState,
  applyTick: (payload) => {
    set(payload)
  }
}))
