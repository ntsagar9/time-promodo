import { z } from 'zod'

export const accentIds = [
  'tomato',
  'ocean',
  'forest',
  'sunset',
  'purple',
  'pink'
] as const
export type AccentId = (typeof accentIds)[number]

export const appThemes = ['dark', 'light', 'system', 'amoled'] as const
export type AppTheme = (typeof appThemes)[number]

export const soundThemes = ['bell', 'digital', 'forest', 'kitchen', 'zen', 'none'] as const
export type SoundThemeId = (typeof soundThemes)[number]

export const ambientSounds = ['none', 'rain', 'white', 'coffee', 'lofi'] as const
export type AmbientSoundId = (typeof ambientSounds)[number]

export const customPresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(30),
  color: z.enum(accentIds),
  workMinutes: z.number().int().min(1).max(120),
  shortBreakMinutes: z.number().int().min(1).max(30),
  longBreakMinutes: z.number().int().min(5).max(60),
  sessionsBeforeLongBreak: z.number().int().min(1).max(10),
  autoStartBreak: z.boolean(),
  autoStartWork: z.boolean(),
  dailySessionTarget: z.number().int().min(1).max(20)
})

export const notificationPrefsSchema = z.object({
  sessionEnd: z.boolean(),
  breakEnd: z.boolean(),
  preWarning: z.boolean(),
  preWarningMinutes: z.union([z.literal(1), z.literal(2), z.literal(5)]),
  dailyGoal: z.boolean(),
  streakMilestone: z.boolean()
})

export const soundPrefsSchema = z.object({
  masterVolume: z.number().int().min(0).max(100),
  theme: z.enum(soundThemes),
  tickEnabled: z.boolean(),
  tickVolume: z.number().int().min(0).max(100),
  uiClicks: z.boolean(),
  ambient: z.enum(ambientSounds),
  ambientVolume: z.number().int().min(0).max(100)
})

export const appearancePrefsSchema = z.object({
  theme: z.enum(appThemes),
  accent: z.enum(accentIds),
  showSessionDots: z.boolean(),
  compactMode: z.boolean(),
  /** When true, main window opacity follows `unfocusedWindowOpacity` while blurred */
  windowTransparencyUnfocused: z.boolean(),
  /** Opacity while unfocused (0.5–1). Ignored when `windowTransparencyUnfocused` is false */
  unfocusedWindowOpacity: z.number().min(0.5).max(1)
})

export const systemPrefsSchema = z.object({
  startAtLogin: z.boolean(),
  alwaysOnTop: z.boolean(),
  minimizeToTrayOnClose: z.boolean(),
  showMiniTimer: z.boolean(),
  miniTimerOpacity: z.number().int().min(20).max(100),
  globalShortcut: z.string().min(1).max(64)
})

export const appSettingsSchema = z.object({
  schemaVersion: z.number().int().min(1).max(999),
  timer: z.object({
    workMinutes: z.number().int().min(1).max(120),
    shortBreakMinutes: z.number().int().min(1).max(30),
    longBreakMinutes: z.number().int().min(5).max(60),
    sessionsBeforeLongBreak: z.number().int().min(1).max(10),
    autoStartBreak: z.boolean(),
    autoStartWork: z.boolean(),
    dailySessionTarget: z.number().int().min(1).max(20),
    skipBreakOption: z.boolean(),
    alertBeforeEnd: z.boolean(),
    alertBeforeEndMinutes: z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(5)
    ]),
    resumeOnRestart: z.boolean()
  }),
  notifications: notificationPrefsSchema,
  sound: soundPrefsSchema,
  appearance: appearancePrefsSchema,
  system: systemPrefsSchema,
  overlay: z.object({
    fullscreenOnPhaseEnd: z.boolean()
  }),
  doNotDisturb: z.boolean(),
  naturalBreakReminderMinutes: z.number().int().min(1).max(30),
  onboardingCompleted: z.boolean(),
  currentPresetId: z.string().min(1),
  customPresets: z.array(customPresetSchema),
  sessionLabels: z.array(z.string().min(1).max(40)).max(50),
  defaultSessionLabel: z.string().min(1).max(40).nullable()
})

export const ipcTimerSetPresetSchema = z.object({
  presetId: z.string().min(1),
  force: z.boolean().optional()
})

export const ipcSettingsSaveSchema = z.object({
  patch: z.record(z.unknown())
})

export const taskItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  estimatedPomodoros: z.number().int().min(1).max(50),
  priority: z.enum(['high', 'medium', 'low']),
  completed: z.boolean(),
  actualPomodoros: z.number().int().min(0).max(500),
  order: z.number().int().min(0).max(100000)
})

export const ipcTasksSaveSchema = z.object({
  tasks: z.array(taskItemSchema),
  activeTaskId: z.string().nullable()
})

export const ipcShortcutsRegisterSchema = z.object({
  accelerator: z.string().min(3).max(80)
})

export const ipcAnalyticsAppendSchema = z.object({
  record: z.object({
    id: z.string().min(1),
    endedAt: z.string().min(1),
    durationSeconds: z.number().int().min(0),
    phase: z.enum(['work', 'shortBreak', 'longBreak']),
    presetId: z.string().min(1),
    presetName: z.string().min(1),
    tasksCompleted: z.array(z.string()),
    label: z.string().max(40).nullable()
  })
})

export type TaskItem = z.infer<typeof taskItemSchema>
