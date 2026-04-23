import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, IPC_EVENTS } from '../../src/types/ipc'

const api = {
  timer: {
    start: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_START),
    pause: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_PAUSE),
    skip: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_SKIP),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESET),
    getState: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_STATE_GET),
    setPreset: (presetId: string, force?: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.TIMER_SET_PRESET, { presetId, force })
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    save: (patch: Record<string, unknown>) =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SAVE, { patch })
  },
  window: {
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
    toggleMini: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE_MINI)
  },
  app: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
    checkUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.APP_CHECK_UPDATE),
    openLogs: () => ipcRenderer.invoke(IPC_CHANNELS.APP_OPEN_LOGS),
    installUpdate: () => ipcRenderer.invoke('app:installUpdate')
  },
  analytics: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_GET),
    export: (format: 'json' | 'csv') =>
      ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_EXPORT, { format })
  },
  tasks: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.TASKS_GET),
    save: (payload: unknown) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_SAVE, payload)
  },
  overlay: {
    dismiss: () => ipcRenderer.invoke('overlay:dismiss'),
    getPending: () => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_GET_PENDING),
    closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.OVERLAY_CLOSE_WINDOW)
  },
  shortcuts: {
    register: (accelerator: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SHORTCUTS_REGISTER, { accelerator })
  },
  shell: {
    openExternal: (url: string) => {
      try {
        const parsed = new URL(url)
        const allowed = ['buymeacoffee.com', 'github.com', 'paypal.com']
        if (allowed.some((domain) => parsed.hostname.endsWith(domain))) {
          return ipcRenderer.invoke(IPC_CHANNELS.SHELL_OPEN_EXTERNAL, { url })
        }
      } catch {
        // ignore invalid urls
      }
      return Promise.resolve({ ok: false as const, error: 'invalid_url' })
    }
  },
  on: (channel: string, listener: (payload: unknown) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: unknown): void => {
      listener(payload)
    }
    ipcRenderer.on(channel, wrapped)
    return () => {
      ipcRenderer.removeListener(channel, wrapped)
    }
  },
  channels: {
    tick: IPC_EVENTS.TIMER_TICK,
    phaseChange: IPC_EVENTS.TIMER_PHASE_CHANGE,
    updateAvailable: IPC_EVENTS.UPDATE_AVAILABLE,
    updateProgress: IPC_EVENTS.UPDATE_PROGRESS,
    updateReady: IPC_EVENTS.UPDATE_READY,
    settingsChanged: IPC_EVENTS.SETTINGS_CHANGED,
    navOpenSettings: 'nav:openSettings',
    navOpenAbout: 'nav:openAbout',
    overlayShow: 'overlay:show',
    toastNudge: IPC_EVENTS.TOAST_NUDGE,
    shortcutsOpen: IPC_EVENTS.SHORTCUTS_OPEN
  }
} as const

contextBridge.exposeInMainWorld('tpromodo', api)

export type PreloadApi = typeof api
