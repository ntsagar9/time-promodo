import type { AppSettings } from '@/types/settings'
import type { SessionRecord } from '@/types/analytics'
import type { TaskItem } from '@/lib/schemas'

export interface TpromodoApi {
  timer: {
    start: () => Promise<{ ok: true } | { ok: false; error?: string }>
    pause: () => Promise<{ ok: true } | { ok: false; error?: string }>
    skip: () => Promise<{ ok: true } | { ok: false; error?: string }>
    reset: () => Promise<{ ok: true } | { ok: false; error?: string }>
    getState: () => Promise<{
      phase: 'work' | 'shortBreak' | 'longBreak'
      runState: 'idle' | 'running' | 'paused'
      remainingSeconds: number
      presetId: string
    }>
    setPreset: (
      presetId: string,
      force?: boolean
    ) => Promise<{ ok: true } | { ok: false; error?: string }>
  }
  settings: {
    get: () => Promise<AppSettings>
    save: (
      patch: Record<string, unknown>
    ) => Promise<{ ok: true } | { ok: false; error?: string }>
  }
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    toggleMini: () => Promise<{ ok: true; showMiniTimer: boolean } | { ok: false }>
  }
  app: {
    getVersion: () => Promise<{ version: string; name: string }>
    checkUpdate: () => Promise<{ ok: true }>
    openLogs: () => Promise<{ ok: true }>
    installUpdate: () => Promise<void>
  }
  analytics: {
    get: () => Promise<SessionRecord[]>
    export: (
      format: 'json' | 'csv'
    ) => Promise<{ ok: true; data: string; mime: string } | { ok: false }>
  }
  tasks: {
    get: () => Promise<{ tasks: TaskItem[]; activeTaskId: string | null }>
    save: (payload: unknown) => Promise<{ ok: true } | { ok: false; error?: string }>
  }
  shortcuts: {
    register: (accelerator: string) => Promise<{ ok: true } | { ok: false; error?: string }>
  }
  shell: {
    openExternal: (url: string) => Promise<{ ok: true } | { ok: false; error?: string }>
  }
  overlay: {
    dismiss: () => Promise<{ ok: true }>,
    getPending: () => Promise<Record<string, unknown> | null>,
    closeWindow: () => Promise<{ ok: true }>
  }
  on: (channel: string, listener: (payload: unknown) => void) => () => void
  channels: {
    tick: string
    phaseChange: string
    updateAvailable: string
    updateProgress: string
    updateReady: string
    settingsChanged: string
    navOpenSettings: string
    navOpenAbout: string
    overlayShow: string
  }
}
