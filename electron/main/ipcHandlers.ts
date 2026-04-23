import { app, ipcMain, shell } from 'electron'
import log from 'electron-log/main'
import {
  appSettingsSchema,
  ipcAnalyticsAppendSchema,
  ipcSettingsSaveSchema,
  ipcShortcutsRegisterSchema,
  ipcTasksSaveSchema,
  ipcTimerSetPresetSchema
} from '../../src/lib/schemas'
import type { AppSettings } from '../../src/types/settings'
import { IPC_CHANNELS } from '../../src/types/ipc'
import {
  appendAnalytics,
  getAnalytics,
  getSettings,
  getTasks,
  setSettings,
  setTasks
} from './store'
import { timerController } from './timerController'
import {
  closeOverlayWindow,
  getMainWindow,
  getPendingOverlayPayload,
  hideMainAnimated,
  toggleMiniWindow
} from './windowManager'
import { checkForUpdatesManual, quitAndInstall } from './autoUpdater'
import logMain from 'electron-log/main'
import { rebuildMenu, registerTrayHandlers } from './trayManager'
import { getPublicTimerSnapshot } from './timerSnapshot'
import { registerGlobalShortcut } from './shortcutManager'

function mergeSettings(
  current: AppSettings,
  patch: Partial<AppSettings>
): AppSettings {
  return {
    ...current,
    ...patch,
    timer: { ...current.timer, ...patch.timer },
    notifications: { ...current.notifications, ...patch.notifications },
    sound: { ...current.sound, ...patch.sound },
    appearance: { ...current.appearance, ...patch.appearance },
    system: { ...current.system, ...patch.system },
    overlay: { ...current.overlay, ...patch.overlay },
    customPresets: patch.customPresets ?? current.customPresets,
    sessionLabels: patch.sessionLabels ?? current.sessionLabels
  }
}

export function registerIpcHandlers(): void {
  registerTrayHandlers({
    toggleRun: () => {
      const snap = getPublicTimerSnapshot()
      if (snap.runState === 'running') {
        timerController.pause()
      } else {
        timerController.start()
      }
      rebuildMenu()
    },
    skip: () => {
      timerController.skip()
      rebuildMenu()
    }
  })

  ipcMain.handle(IPC_CHANNELS.TIMER_START, () => {
    logMain.debug(IPC_CHANNELS.TIMER_START)
    timerController.start()
    rebuildMenu()
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.TIMER_PAUSE, () => {
    logMain.debug(IPC_CHANNELS.TIMER_PAUSE)
    timerController.pause()
    rebuildMenu()
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.TIMER_SKIP, () => {
    logMain.debug(IPC_CHANNELS.TIMER_SKIP)
    timerController.skip()
    rebuildMenu()
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.TIMER_RESET, () => {
    logMain.debug(IPC_CHANNELS.TIMER_RESET)
    timerController.reset()
    rebuildMenu()
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.TIMER_SET_PRESET, (_e, raw: unknown) => {
    const parsed = ipcTimerSetPresetSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false as const, error: 'invalid_payload' }
    }
    const merged = mergeSettings(getSettings(), {
      currentPresetId: parsed.data.presetId
    })
    const valid = appSettingsSchema.safeParse(merged)
    if (valid.success) {
      setSettings(valid.data)
    }
    timerController.applyPreset(parsed.data.presetId)
    rebuildMenu()
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => getSettings())

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SAVE, (_e, raw: unknown) => {
    const parsed = ipcSettingsSaveSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false as const, error: 'invalid_payload' }
    }
    const merged = mergeSettings(
      getSettings(),
      parsed.data.patch as Partial<AppSettings>
    )
    const valid = appSettingsSchema.safeParse(merged)
    if (!valid.success) {
      log.warn('settings validation failed', valid.error.flatten())
      return { ok: false as const, error: 'invalid_settings' }
    }
    setSettings(valid.data)
    app.setLoginItemSettings({ openAtLogin: valid.data.system.startAtLogin })
    getMainWindow()?.setAlwaysOnTop(valid.data.system.alwaysOnTop)
    toggleMiniWindow(valid.data.system.showMiniTimer)
    registerGlobalShortcut()
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    getMainWindow()?.minimize()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const win = getMainWindow()
    if (!win) {
      return
    }
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
    const settings = getSettings()
    if (settings.system.minimizeToTrayOnClose) {
      hideMainAnimated()
    } else {
      getMainWindow()?.close()
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_MINI, () => {
    const settings = getSettings()
    const next = !settings.system.showMiniTimer
    const merged = mergeSettings(settings, {
      system: { ...settings.system, showMiniTimer: next }
    })
    const valid = appSettingsSchema.safeParse(merged)
    if (valid.success) {
      setSettings(valid.data)
    }
    toggleMiniWindow(next)
    return { ok: true as const, showMiniTimer: next }
  })

  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => ({
    version: app.getVersion(),
    name: app.getName()
  }))

  ipcMain.handle(IPC_CHANNELS.APP_CHECK_UPDATE, async () => {
    await checkForUpdatesManual()
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.APP_OPEN_LOGS, async () => {
    await shell.openPath(logMain.transports.file.getFile().path)
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.ANALYTICS_EXPORT, async (_e, raw: unknown) => {
    const format =
      typeof raw === 'object' && raw !== null && 'format' in raw
        ? String((raw as { format?: string }).format)
        : 'json'
    const data = getAnalytics()
    if (format === 'csv') {
      const header = 'id,endedAt,durationSeconds,phase,presetId,presetName,label\n'
      const rows = data
        .map(
          (r) =>
            `${r.id},${r.endedAt},${r.durationSeconds},${r.phase},${r.presetId},${r.presetName.replace(/,/g, ';')},${r.label ?? ''}`
        )
        .join('\n')
      return { ok: true as const, data: header + rows, mime: 'text/csv' }
    }
    return {
      ok: true as const,
      data: JSON.stringify(
        { exportedAt: new Date().toISOString(), schemaVersion: 1, sessions: data },
        null,
        2
      ),
      mime: 'application/json'
    }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_GET, () => getTasks())

  ipcMain.handle(IPC_CHANNELS.TASKS_SAVE, (_e, raw: unknown) => {
    const parsed = ipcTasksSaveSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false as const, error: 'invalid_payload' }
    }
    setTasks(parsed.data)
    rebuildMenu()
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.ANALYTICS_GET, () => getAnalytics())

  ipcMain.handle(IPC_CHANNELS.ANALYTICS_APPEND, (_e, raw: unknown) => {
    const parsed = ipcAnalyticsAppendSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false as const, error: 'invalid_payload' }
    }
    appendAnalytics(parsed.data.record)
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.TIMER_STATE_GET, () => getPublicTimerSnapshot())

  ipcMain.handle('overlay:dismiss', () => {
    timerController.dismissOverlay()
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.OVERLAY_GET_PENDING, () => getPendingOverlayPayload())

  ipcMain.handle(IPC_CHANNELS.OVERLAY_CLOSE_WINDOW, () => {
    closeOverlayWindow()
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.SHORTCUTS_REGISTER, (_e, raw: unknown) => {
    const parsed = ipcShortcutsRegisterSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false as const, error: 'invalid_payload' }
    }
    const cur = getSettings()
    const merged = mergeSettings(cur, {
      system: { ...cur.system, globalShortcut: parsed.data.accelerator }
    })
    const valid = appSettingsSchema.safeParse(merged)
    if (!valid.success) {
      return { ok: false as const, error: 'invalid_shortcut' }
    }
    setSettings(valid.data)
    registerGlobalShortcut()
    return { ok: true as const }
  })

  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_EXTERNAL, async (_e, raw: unknown) => {
    const url =
      typeof raw === 'object' && raw !== null && 'url' in raw
        ? String((raw as { url?: string }).url ?? '')
        : ''
    const allowed = ['buymeacoffee.com', 'github.com', 'paypal.com']
    try {
      const parsed = new URL(url)
      if (!allowed.some((domain) => parsed.hostname.endsWith(domain))) {
        return { ok: false as const, error: 'domain_not_allowed' }
      }
      await shell.openExternal(url)
      return { ok: true as const }
    } catch {
      return { ok: false as const, error: 'invalid_url' }
    }
  })

  ipcMain.handle('app:installUpdate', () => {
    quitAndInstall()
  })

  log.info('ipc handlers registered')
}
