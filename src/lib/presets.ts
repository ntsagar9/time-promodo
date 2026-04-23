import type { CustomPreset } from '@/types/settings'
import type { AccentId } from '@/lib/schemas'

export interface BuiltInPreset {
  id: string
  name: string
  color: AccentId
  work: number
  shortBreak: number
  longBreak: number
  sessions: number
  locked: true
}

export const BUILT_IN_PRESETS: BuiltInPreset[] = [
  {
    id: 'builtin-classic',
    name: 'Classic Pomodoro',
    color: 'tomato',
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    sessions: 4,
    locked: true
  },
  {
    id: 'builtin-extended',
    name: 'Extended Focus',
    color: 'ocean',
    work: 50,
    shortBreak: 10,
    longBreak: 30,
    sessions: 2,
    locked: true
  },
  {
    id: 'builtin-short',
    name: 'Short Burst',
    color: 'forest',
    work: 15,
    shortBreak: 3,
    longBreak: 10,
    sessions: 6,
    locked: true
  },
  {
    id: 'builtin-deep',
    name: 'Deep Work',
    color: 'purple',
    work: 90,
    shortBreak: 20,
    longBreak: 45,
    sessions: 2,
    locked: true
  },
  {
    id: 'builtin-study',
    name: 'Study Session',
    color: 'sunset',
    work: 45,
    shortBreak: 10,
    longBreak: 20,
    sessions: 3,
    locked: true
  },
  {
    id: 'builtin-quick',
    name: 'Quick Tasks',
    color: 'pink',
    work: 10,
    shortBreak: 2,
    longBreak: 10,
    sessions: 8,
    locked: true
  }
]

export function builtInToCustom(p: BuiltInPreset): CustomPreset {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    workMinutes: p.work,
    shortBreakMinutes: p.shortBreak,
    longBreakMinutes: p.longBreak,
    sessionsBeforeLongBreak: p.sessions,
    autoStartBreak: false,
    autoStartWork: false,
    dailySessionTarget: 8
  }
}

export function getPresetById(
  id: string,
  custom: readonly CustomPreset[]
): CustomPreset | undefined {
  const built = BUILT_IN_PRESETS.find((b) => b.id === id)
  if (built) {
    return builtInToCustom(built)
  }
  return custom.find((c) => c.id === id)
}
