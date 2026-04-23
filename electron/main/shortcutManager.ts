import { globalShortcut } from 'electron'
import log from 'electron-log/main'
import { appSettingsSchema } from '../../src/lib/schemas'
import { getSettings, setSettings } from './store'
import { timerController } from './timerController'
import { getPublicTimerSnapshot } from './timerSnapshot'
import { getMainWindow, showMainAnimated, toggleMiniWindow } from './windowManager'
import { rebuildMenu } from './trayManager'

function registerSafe(accelerator: string, callback: () => void): void {
  try {
    const ok = globalShortcut.register(accelerator, callback)
    if (!ok) {
      log.warn('Global shortcut registration returned false', accelerator)
    }
  } catch (e) {
    log.warn('Failed to register global shortcut', accelerator, e)
  }
}

/** Registers primary + fixed auxiliary shortcuts. // DONE */
export function registerGlobalShortcut(): void {
  globalShortcut.unregisterAll()
  const settings = getSettings()

  registerSafe(settings.system.globalShortcut, () => {
    const snap = getPublicTimerSnapshot()
    if (snap.runState === 'running') {
      timerController.pause()
    } else {
      timerController.start()
    }
    rebuildMenu()
  })

  registerSafe('CommandOrControl+Shift+R', () => {
    timerController.reset()
    rebuildMenu()
  })

  registerSafe('CommandOrControl+,', () => {
    showMainAnimated()
    getMainWindow()?.webContents.send('nav:openSettings')
  })

  registerSafe('CommandOrControl+Shift+M', () => {
    const s = getSettings()
    const next = !s.system.showMiniTimer
    const merged = { ...s, system: { ...s.system, showMiniTimer: next } }
    const parsed = appSettingsSchema.safeParse(merged)
    if (parsed.success) {
      setSettings(parsed.data)
    }
    toggleMiniWindow(next)
    rebuildMenu()
  })

  registerSafe('CommandOrControl+Shift+T', () => {
    const win = getMainWindow()
    if (!win) {
      return
    }
    if (win.isVisible()) {
      win.hide()
    } else {
      showMainAnimated()
    }
  })

  registerSafe('CommandOrControl+Shift+/', () => {
    getMainWindow()?.webContents.send('shortcuts:open')
  })
}
