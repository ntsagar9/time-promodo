import { create } from 'zustand'
import type { AppSettings } from '@/types/settings'
import { BUILT_IN_PRESETS, builtInToCustom } from '@/lib/presets'

interface SettingsStore {
  settings: AppSettings | null
  hydrated: boolean
  hydrate: () => Promise<void>
  updateLocal: (next: AppSettings) => void
  save: (patch: Record<string, unknown>) => Promise<void>
}

const fallback = (): AppSettings => {
  const classic = builtInToCustom(BUILT_IN_PRESETS[0]!)
  return {
    schemaVersion: 2,
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
    overlay: { fullscreenOnPhaseEnd: true },
    doNotDisturb: false,
    naturalBreakReminderMinutes: 2,
    onboardingCompleted: false,
    currentPresetId: classic.id,
    customPresets: [],
    sessionLabels: ['Deep Work', 'Reading', 'Emails'],
    defaultSessionLabel: null
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  hydrated: false,
  hydrate: async () => {
    const s = await window.tpromodo.settings.get()
    set({ settings: s, hydrated: true })
    applyThemeToDom(s)
  },
  updateLocal: (next) => {
    set({ settings: next })
    applyThemeToDom(next)
  },
  save: async (patch) => {
    const res = await window.tpromodo.settings.save(patch)
    if (!res.ok) {
      return
    }
    const next = await window.tpromodo.settings.get()
    get().updateLocal(next)
  }
}))

export function scheduleDebouncedSettingsSave(
  patch: Record<string, unknown>,
  ms = 500
): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
  saveTimer = setTimeout(() => {
    void useSettingsStore.getState().save(patch)
  }, ms)
}

/** Instant theme/accent preview without waiting for debounced save. // DONE */
export function applyAppearanceLive(
  patch: Partial<AppSettings['appearance']>
): void {
  const cur = useSettingsStore.getState().settings
  if (!cur) {
    return
  }
  const next: AppSettings = {
    ...cur,
    appearance: { ...cur.appearance, ...patch }
  }
  useSettingsStore.getState().updateLocal(next)
  scheduleDebouncedSettingsSave({ appearance: patch })
}

function applyThemeToDom(settings: AppSettings): void {
  const root = document.documentElement
  root.classList.remove(
    'theme-light',
    'theme-amoled',
    'accent-tomato',
    'accent-ocean',
    'accent-forest',
    'accent-sunset',
    'accent-purple',
    'accent-pink'
  )
  if (settings.appearance.theme === 'light') {
    root.classList.add('theme-light')
  } else if (settings.appearance.theme === 'amoled') {
    root.classList.add('theme-amoled')
  }
  root.classList.add(`accent-${settings.appearance.accent}`)
}

export function useEffectiveSettings(): AppSettings {
  const s = useSettingsStore((x) => x.settings)
  return s ?? fallback()
}
