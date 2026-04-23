import storeEntry from 'electron-store'
import type { Options } from 'electron-store'
import type ElectronStore from 'electron-store'
import { appSettingsSchema, type TaskItem } from '../../src/lib/schemas'
import type { AppSettings } from '../../src/types/settings'
import type { SessionRecord } from '../../src/types/analytics'
import type { TimerPhase, TimerRunState } from '../../src/types/timer'
import { BUILT_IN_PRESETS, builtInToCustom } from '../../src/lib/presets'

const STORE_VERSION = 3

export interface PersistedTimerState {
  runState: TimerRunState
  phase: TimerPhase
  remainingSeconds: number
  completedWorkSessionsInCycle: number
  presetId: string
  lastTickAt: string | null
}

export interface TasksPayload {
  tasks: TaskItem[]
  activeTaskId: string | null
}

function defaultSettings(): AppSettings {
  const classic = builtInToCustom(BUILT_IN_PRESETS[0]!)
  return {
    schemaVersion: STORE_VERSION,
    timer: {
      workMinutes: classic.workMinutes,
      shortBreakMinutes: classic.shortBreakMinutes,
      longBreakMinutes: classic.longBreakMinutes,
      sessionsBeforeLongBreak: classic.sessionsBeforeLongBreak,
      autoStartBreak: false,
      autoStartWork: false,
      dailySessionTarget: classic.dailySessionTarget,
      skipBreakOption: true,
      alertBeforeEnd: true,
      alertBeforeEndMinutes: 2,
      resumeOnRestart: true
    },
    notifications: {
      sessionEnd: true,
      breakEnd: true,
      preWarning: true,
      preWarningMinutes: 2,
      dailyGoal: true,
      streakMilestone: true
    },
    sound: {
      masterVolume: 80,
      theme: 'bell',
      tickEnabled: false,
      tickVolume: 40,
      uiClicks: true,
      ambient: 'none',
      ambientVolume: 65
    },
    appearance: {
      theme: 'dark',
      accent: 'tomato',
      showSessionDots: true,
      compactMode: false,
      windowTransparencyUnfocused: false,
      unfocusedWindowOpacity: 0.92
    },
    system: {
      startAtLogin: false,
      alwaysOnTop: false,
      minimizeToTrayOnClose: true,
      showMiniTimer: false,
      miniTimerOpacity: 88,
      globalShortcut: 'CommandOrControl+Shift+Space'
    },
    overlay: {
      fullscreenOnPhaseEnd: true
    },
    doNotDisturb: false,
    naturalBreakReminderMinutes: 2,
    onboardingCompleted: false,
    currentPresetId: classic.id,
    customPresets: [],
    sessionLabels: ['Deep Work', 'Reading', 'Emails'],
    defaultSessionLabel: null
  }
}

function coerceStoredAppSettings(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object') {
    return raw
  }
  const o = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>

  const appearance = o.appearance
  if (appearance && typeof appearance === 'object') {
    const a = appearance as Record<string, unknown>
    if ('windowTransparencyPercent' in a && !('unfocusedWindowOpacity' in a)) {
      const pct = Number(a.windowTransparencyPercent)
      a.unfocusedWindowOpacity = Number.isFinite(pct)
        ? Math.min(1, Math.max(0.5, pct / 100))
        : 0.92
      delete a.windowTransparencyPercent
    }
    if (typeof a.unfocusedWindowOpacity !== 'number') {
      a.unfocusedWindowOpacity = 0.92
    }
  }

  const sound = o.sound
  if (sound && typeof sound === 'object' && !('ambientVolume' in sound)) {
    ;(sound as Record<string, unknown>).ambientVolume = 65
  }

  if (Array.isArray(o.customPresets)) {
    o.customPresets = o.customPresets.map((p) => {
      if (!p || typeof p !== 'object') {
        return p
      }
      const c = { ...(p as Record<string, unknown>) }
      if (typeof c.name === 'string' && c.name.length > 30) {
        c.name = c.name.slice(0, 30)
      }
      if (typeof c.color !== 'string') {
        c.color = 'tomato'
      }
      return c
    })
  }

  if (typeof o.defaultSessionLabel === 'string' && o.defaultSessionLabel.length > 40) {
    o.defaultSessionLabel = o.defaultSessionLabel.slice(0, 40)
  }
  if (Array.isArray(o.sessionLabels)) {
    o.sessionLabels = o.sessionLabels.map((s) =>
      typeof s === 'string' ? s.slice(0, 40) : s
    )
  }

  return o
}

function migrateSettings(raw: unknown): AppSettings {
  const base = defaultSettings()
  const coerced = coerceStoredAppSettings(raw)
  const parsed = appSettingsSchema.safeParse(coerced)
  if (parsed.success) {
    return { ...base, ...parsed.data, schemaVersion: STORE_VERSION }
  }
  return base
}

interface StoreSchema {
  settings: AppSettings
  timer: PersistedTimerState | null
  analytics: SessionRecord[]
  tasks: TasksPayload
  crashPending: boolean
  /** Dedup streak milestone notifications, e.g. `2026-04-23-7` */
  lastStreakMilestoneKey: string | null
}

type ElectronStoreForSchema = ElectronStore<StoreSchema>
type ElectronStoreCtor = new (options?: Options<StoreSchema>) => ElectronStoreForSchema

/**
 * electron-store v10 is ESM-only; Rollup emits `require("electron-store")` for the
 * main bundle, which yields `{ default: class }` — not a callable constructor.
 */
function getElectronStoreClass(): ElectronStoreCtor {
  const mod: unknown = storeEntry
  if (typeof mod === 'function') {
    return mod as ElectronStoreCtor
  }
  if (
    mod !== null &&
    typeof mod === 'object' &&
    'default' in mod &&
    typeof (mod as { default: unknown }).default === 'function'
  ) {
    return (mod as { default: ElectronStoreCtor }).default
  }
  throw new Error('electron-store: could not resolve Store constructor')
}

const StoreConstructor = getElectronStoreClass()

export const appStore = new StoreConstructor({
  name: 'timerpromodo',
  defaults: {
    settings: defaultSettings(),
    timer: null,
    analytics: [],
    tasks: { tasks: [], activeTaskId: null },
    crashPending: false,
    lastStreakMilestoneKey: null
  }
})

export function getSettings(): AppSettings {
  return migrateSettings(appStore.get('settings'))
}

export function setSettings(next: AppSettings): void {
  appStore.set('settings', next)
}

export function patchSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const merged = { ...current, ...partial }
  const parsed = appSettingsSchema.safeParse(merged)
  if (!parsed.success) {
    return current
  }
  setSettings(parsed.data)
  return parsed.data
}

export function getTimerPersisted(): PersistedTimerState | null {
  return appStore.get('timer')
}

export function setTimerPersisted(state: PersistedTimerState | null): void {
  appStore.set('timer', state)
}

export function getAnalytics(): SessionRecord[] {
  return appStore.get('analytics')
}

export function appendAnalytics(record: SessionRecord): void {
  const list = [...appStore.get('analytics'), record]
  appStore.set('analytics', list)
}

export function getTasks(): TasksPayload {
  return appStore.get('tasks')
}

export function setTasks(payload: TasksPayload): void {
  appStore.set('tasks', payload)
}

export function getLastStreakMilestoneKey(): string | null {
  return appStore.get('lastStreakMilestoneKey')
}

export function setLastStreakMilestoneKey(key: string | null): void {
  appStore.set('lastStreakMilestoneKey', key)
}
