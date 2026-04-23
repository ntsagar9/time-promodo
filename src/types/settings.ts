import type { AccentId, AppTheme, AmbientSoundId, SoundThemeId } from '@/lib/schemas'

export type { AccentId, AppTheme, AmbientSoundId, SoundThemeId }

export interface CustomPreset {
  id: string
  name: string
  color: AccentId
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  autoStartWork: boolean
  dailySessionTarget: number
}

export interface NotificationPrefs {
  sessionEnd: boolean
  breakEnd: boolean
  preWarning: boolean
  preWarningMinutes: 1 | 2 | 5
  dailyGoal: boolean
  streakMilestone: boolean
}

export interface SoundPrefs {
  masterVolume: number
  theme: SoundThemeId
  tickEnabled: boolean
  tickVolume: number
  uiClicks: boolean
  ambient: AmbientSoundId
  ambientVolume: number
}

export interface AppearancePrefs {
  theme: AppTheme
  accent: AccentId
  showSessionDots: boolean
  compactMode: boolean
  windowTransparencyUnfocused: boolean
  unfocusedWindowOpacity: number
}

export interface SystemPrefs {
  startAtLogin: boolean
  alwaysOnTop: boolean
  minimizeToTrayOnClose: boolean
  showMiniTimer: boolean
  miniTimerOpacity: number
  globalShortcut: string
}

export interface AppSettings {
  schemaVersion: number
  timer: {
    workMinutes: number
    shortBreakMinutes: number
    longBreakMinutes: number
    sessionsBeforeLongBreak: number
    autoStartBreak: boolean
    autoStartWork: boolean
    dailySessionTarget: number
    skipBreakOption: boolean
    alertBeforeEnd: boolean
    alertBeforeEndMinutes: 0 | 1 | 2 | 5
    resumeOnRestart: boolean
  }
  notifications: NotificationPrefs
  sound: SoundPrefs
  appearance: AppearancePrefs
  system: SystemPrefs
  overlay: {
    fullscreenOnPhaseEnd: boolean
  }
  doNotDisturb: boolean
  naturalBreakReminderMinutes: number
  onboardingCompleted: boolean
  currentPresetId: string
  customPresets: CustomPreset[]
  sessionLabels: string[]
  defaultSessionLabel: string | null
}
