import { randomUUID } from 'node:crypto'
import log from 'electron-log/main'
import type { TimerPhase, TimerRunState } from '../../src/types/timer'
import type { CustomPreset } from '../../src/types/settings'
import type { SessionRecord } from '../../src/types/analytics'
import {
  afterBreakPhase,
  applyPresetToSnapshot,
  createInitialSnapshot,
  phaseDurationsSeconds,
  tickSnapshot,
  type EngineSnapshot
} from '../../src/lib/timerEngine'
import { BUILT_IN_PRESETS, builtInToCustom, getPresetById } from '../../src/lib/presets'
import {
  appendAnalytics,
  getAnalytics,
  getLastStreakMilestoneKey,
  getSettings,
  getTimerPersisted,
  setLastStreakMilestoneKey,
  setTimerPersisted,
  type PersistedTimerState
} from './store'
import { getMainWindow, miniWindow, showOverlay, hideOverlay } from './windowManager'
import { updateTray } from './trayManager'
import { setPublicTimerSnapshot } from './timerSnapshot'
import {
  notifyBreakEndDetailed,
  notifyDailyGoal,
  notifyNaturalBreakNudge,
  notifyPreWarningDetailed,
  notifySessionCompleteDetailed,
  notifyStreak
} from './notificationManager'
import { app } from 'electron'
import { calculateFocusScore } from '../../src/lib/focusScore'

interface InternalState {
  snapshot: EngineSnapshot
  presetId: string
  preWarnSent: boolean
  idleBreakSince: number | null
}

let interval: NodeJS.Timeout | null = null
let state: InternalState | null = null
let lastSkipAt = 0
const SKIP_COOLDOWN_MS = 180

function broadcast(channel: string, payload: unknown): void {
  const payloadStr = JSON.stringify(payload)
  getMainWindow()?.webContents.send(channel, payload)
  miniWindow?.webContents.send(channel, JSON.parse(payloadStr))
}

function currentPreset(): CustomPreset {
  const settings = getSettings()
  const preset =
    getPresetById(settings.currentPresetId, settings.customPresets) ??
    builtInToCustom(BUILT_IN_PRESETS[0]!)
  return preset
}

function toPersisted(s: EngineSnapshot, presetId: string): PersistedTimerState {
  return {
    runState: s.runState,
    phase: s.phase,
    remainingSeconds: s.remainingSeconds,
    completedWorkSessionsInCycle: s.completedWorkSessionsInCycle,
    presetId,
    lastTickAt: new Date().toISOString()
  }
}

function syncPublicSnapshot(): void {
  if (!state) {
    return
  }
  setPublicTimerSnapshot({
    phase: state.snapshot.phase,
    runState: state.snapshot.runState,
    remainingSeconds: state.snapshot.remainingSeconds,
    presetId: state.presetId
  })
  updateTray(
    state.snapshot.phase,
    state.snapshot.runState,
    state.snapshot.remainingSeconds
  )
  updateDockBadge()
}

function updateDockBadge(): void {
  const today = new Date().toDateString()
  const count = getAnalytics().filter(
    (r) => new Date(r.endedAt).toDateString() === today && r.phase === 'work'
  ).length
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setBadge(count > 0 ? String(count) : '')
  }
}

function computeStreak(): { current: number; longest: number } {
  const days = new Set(
    getAnalytics()
      .filter((r) => r.phase === 'work')
      .map((r) => new Date(r.endedAt).toDateString())
  )
  const sorted = [...days].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )
  let current = 0
  const today = new Date()
  for (let i = 0; i < 400; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toDateString()
    if (sorted.includes(key)) {
      current++
    } else if (i === 0) {
      continue
    } else {
      break
    }
  }
  return { current, longest: current }
}

function todayWorkCount(): number {
  const today = new Date().toDateString()
  return getAnalytics().filter(
    (r) => new Date(r.endedAt).toDateString() === today && r.phase === 'work'
  ).length
}

const STREAK_MILESTONES = new Set([3, 7, 14, 21, 30, 60, 100])

function recordWorkSession(durationSeconds: number): void {
  const settings = getSettings()
  const preset = currentPreset()
  const record: SessionRecord = {
    id: randomUUID(),
    endedAt: new Date().toISOString(),
    durationSeconds,
    phase: 'work',
    presetId: preset.id,
    presetName: preset.name,
    tasksCompleted: [],
    label: settings.defaultSessionLabel
  }
  appendAnalytics(record)
  const count = todayWorkCount()
  if (settings.notifications.dailyGoal && count === settings.timer.dailySessionTarget) {
    notifyDailyGoal(count, settings.doNotDisturb)
  }
  const streak = computeStreak().current
  if (
    settings.notifications.streakMilestone &&
    STREAK_MILESTONES.has(streak)
  ) {
    const day = new Date().toISOString().slice(0, 10)
    const key = `${day}-${String(streak)}`
    if (getLastStreakMilestoneKey() !== key) {
      notifyStreak(streak, settings.doNotDisturb)
      setLastStreakMilestoneKey(key)
    }
  }
}

function maybePreWarn(): void {
  if (!state) {
    return
  }
  const settings = getSettings()
  if (!settings.notifications.preWarning || state.preWarnSent) {
    return
  }
  if (state.snapshot.phase !== 'work' || state.snapshot.runState !== 'running') {
    return
  }
  const minutes = settings.notifications.preWarningMinutes
  const threshold = minutes * 60
  if (threshold <= 0) {
    return
  }
  if (
    threshold > 0 &&
    state.snapshot.remainingSeconds <= threshold &&
    state.snapshot.remainingSeconds > threshold - 2
  ) {
    state.preWarnSent = true
    const preset = currentPreset()
    notifyPreWarningDetailed({
      minutesLeft: minutes,
      doNotDisturb: settings.doNotDisturb,
      presetName: preset.name,
      color: preset.color
    })
  }
}

function maybeNaturalBreakNudge(): void {
  if (!state) {
    return
  }
  const settings = getSettings()
  if (state.snapshot.phase === 'shortBreak' || state.snapshot.phase === 'longBreak') {
    if (state.snapshot.runState === 'idle' && state.idleBreakSince) {
      const elapsed = Date.now() - state.idleBreakSince
      const limit = settings.naturalBreakReminderMinutes * 60 * 1000
      if (elapsed > limit) {
        notifyNaturalBreakNudge(settings.doNotDisturb)
        state.idleBreakSince = Date.now()
      }
    }
  }
}

function completePhaseTransition(reason: 'complete' | 'skip' = 'complete'): void {
  if (!state) {
    return
  }
  const settings = getSettings()
  const preset = currentPreset()
  const durations = phaseDurationsSeconds(preset)
  const previousPhase = state.snapshot.phase
  let celebrationSetComplete = false

  if (state.snapshot.phase === 'work') {
    recordWorkSession(durations.work)
    const newCompleted = state.snapshot.completedWorkSessionsInCycle + 1
    const cycle = preset.sessionsBeforeLongBreak
    const longNext = newCompleted > 0 && newCompleted % cycle === 0
    celebrationSetComplete = longNext
    const nextPhase: TimerPhase = longNext ? 'longBreak' : 'shortBreak'
    state.snapshot = {
      runState: settings.timer.autoStartBreak ? 'running' : 'idle',
      phase: nextPhase,
      remainingSeconds: durations[nextPhase],
      completedWorkSessionsInCycle: longNext ? 0 : newCompleted
    }
    if (settings.notifications.sessionEnd) {
      notifySessionCompleteDetailed({
        doNotDisturb: settings.doNotDisturb,
        presetName: preset.name,
        minutes: durations.work / 60,
        color: preset.color
      })
    }
    if (settings.overlay.fullscreenOnPhaseEnd && reason === 'complete') {
      showOverlay({
        title: 'Focus session complete',
        subtitle: 'Step away from the screen for a few minutes.',
        action: settings.timer.autoStartBreak ? 'auto' : 'startBreak',
        phase: state.snapshot.phase
      })
    }
  } else {
    if (settings.notifications.breakEnd) {
      notifyBreakEndDetailed({
        doNotDisturb: settings.doNotDisturb,
        presetName: preset.name,
        nextWorkMinutes: durations.work / 60,
        color: preset.color
      })
    }
    const next = afterBreakPhase(
      state.snapshot.phase,
      state.snapshot.completedWorkSessionsInCycle,
      preset.sessionsBeforeLongBreak
    )
    state.snapshot = {
      runState: settings.timer.autoStartWork ? 'running' : 'idle',
      phase: next.phase,
      remainingSeconds: durations.work,
      completedWorkSessionsInCycle: next.completedWorkSessionsInCycle
    }
    if (settings.overlay.fullscreenOnPhaseEnd && reason === 'complete') {
      showOverlay({
        title: 'Break complete',
        subtitle: 'Settle in — your next focus block is ready.',
        action: settings.timer.autoStartWork ? 'auto' : 'startWork',
        phase: 'work'
      })
    }
  }

  state.preWarnSent = false
  state.idleBreakSince =
    state.snapshot.runState === 'idle' &&
    (state.snapshot.phase === 'shortBreak' || state.snapshot.phase === 'longBreak')
      ? Date.now()
      : null

  broadcast('timer:phaseChange', {
    previousPhase,
    phase: state.snapshot.phase,
    reason,
    celebrationSetComplete
  })
}

function tick(): void {
  if (!state) {
    return
  }
  if (state.snapshot.runState === 'running') {
    state.snapshot = tickSnapshot(state.snapshot)
  }
  maybePreWarn()
  maybeNaturalBreakNudge()

  if (state.snapshot.remainingSeconds <= 0) {
    completePhaseTransition()
  }

  setTimerPersisted(toPersisted(state.snapshot, state.presetId))
  syncPublicSnapshot()
  broadcast('timer:tick', buildTickPayload())
}

function buildTickPayload() {
  if (!state) {
    return null
  }
  const settings = getSettings()
  const today = todayWorkCount()
  const target = settings.timer.dailySessionTarget
  const streakDays = computeStreak().current
  const focusScore = calculateFocusScore({
    completedSessionsToday: today,
    dailyTarget: target,
    streakDays,
    avgSessionCompletionRate: 0.95
  })
  return {
    phase: state.snapshot.phase,
    runState: state.snapshot.runState,
    remainingSeconds: state.snapshot.remainingSeconds,
    completedWorkSessionsInCycle: state.snapshot.completedWorkSessionsInCycle,
    dailySessionTarget: target,
    todayCompletedSessions: today,
    presetId: state.presetId,
    activeTaskTitle: null,
    sessionLabel: settings.defaultSessionLabel,
    focusScoreToday: focusScore
  }
}

function ensureInterval(): void {
  if (interval) {
    return
  }
  interval = setInterval(() => {
    if (state?.snapshot.runState === 'running') {
      tick()
    }
  }, 1000)
}

function stopInterval(): void {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

function hydrateFromPersisted(): void {
  const settings = getSettings()
  const preset = currentPreset()
  const persisted = getTimerPersisted()
  if (persisted && settings.timer.resumeOnRestart && persisted.presetId === settings.currentPresetId) {
    let remaining = persisted.remainingSeconds
    let run: TimerRunState = persisted.runState
    if (persisted.runState === 'running' && persisted.lastTickAt) {
      const gap = Math.floor(
        (Date.now() - new Date(persisted.lastTickAt).getTime()) / 1000
      )
      remaining = Math.max(0, remaining - gap)
      run = 'paused'
    }
    state = {
      snapshot: {
        runState: run,
        phase: persisted.phase,
        remainingSeconds: remaining,
        completedWorkSessionsInCycle: persisted.completedWorkSessionsInCycle
      },
      presetId: persisted.presetId,
      preWarnSent: false,
      idleBreakSince: null
    }
  } else {
    state = {
      snapshot: createInitialSnapshot(preset, 'work'),
      presetId: settings.currentPresetId,
      preWarnSent: false,
      idleBreakSince: null
    }
  }
  if (state.snapshot.remainingSeconds <= 0) {
    completePhaseTransition()
  }
  syncPublicSnapshot()
  broadcast('timer:tick', buildTickPayload())
}

export const timerController = {
  init(): void {
    hydrateFromPersisted()
    ensureInterval()
    log.info('timerController init')
  },
  start(): void {
    if (!state) {
      hydrateFromPersisted()
    }
    if (!state) {
      return
    }
    state.snapshot = { ...state.snapshot, runState: 'running' }
    state.idleBreakSince = null
    setTimerPersisted(toPersisted(state.snapshot, state.presetId))
    syncPublicSnapshot()
    broadcast('timer:tick', buildTickPayload())
    ensureInterval()
  },
  pause(): void {
    if (!state) {
      return
    }
    state.snapshot = { ...state.snapshot, runState: 'paused' }
    setTimerPersisted(toPersisted(state.snapshot, state.presetId))
    syncPublicSnapshot()
    broadcast('timer:tick', buildTickPayload())
  },
  skip(): void {
    if (!state) {
      return
    }
    const now = Date.now()
    if (now - lastSkipAt < SKIP_COOLDOWN_MS) {
      return
    }
    lastSkipAt = now
    state.snapshot = { ...state.snapshot, remainingSeconds: 0 }
    completePhaseTransition('skip')
    setTimerPersisted(toPersisted(state.snapshot, state.presetId))
    syncPublicSnapshot()
    broadcast('timer:tick', buildTickPayload())
  },
  reset(): void {
    const preset = currentPreset()
    state = {
      snapshot: createInitialSnapshot(preset, 'work'),
      presetId: getSettings().currentPresetId,
      preWarnSent: false,
      idleBreakSince: null
    }
    setTimerPersisted(toPersisted(state.snapshot, state.presetId))
    syncPublicSnapshot()
    broadcast('timer:tick', buildTickPayload())
  },
  applyPreset(presetId: string): void {
    const settings = getSettings()
    const preset =
      getPresetById(presetId, settings.customPresets) ?? builtInToCustom(BUILT_IN_PRESETS[0]!)
    state = {
      snapshot: applyPresetToSnapshot(
        state?.snapshot ?? createInitialSnapshot(preset, 'work'),
        preset,
        true
      ),
      presetId: preset.id,
      preWarnSent: false,
      idleBreakSince: null
    }
    setTimerPersisted(toPersisted(state.snapshot, state.presetId))
    syncPublicSnapshot()
    broadcast('timer:tick', buildTickPayload())
  },
  shutdown(): void {
    if (state) {
      setTimerPersisted(toPersisted(state.snapshot, state.presetId))
    }
    stopInterval()
  },
  dismissOverlay(): void {
    hideOverlay()
  }
}
