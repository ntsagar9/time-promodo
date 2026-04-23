import { app, nativeImage, nativeTheme } from 'electron'
import { join } from 'node:path'
import log from 'electron-log/main'
import {
  attachGlobalErrorHandlers,
  initCrashReporter,
  maybePromptCrashRecovery
} from './crashReporter'
import { setupAutoUpdater, bindAutoUpdater, scheduleUpdateChecks } from './autoUpdater'
import { createMainWindow, getMainWindow, showMainAnimated } from './windowManager'
import { registerIpcHandlers } from './ipcHandlers'
import { timerController } from './timerController'
import { initTray } from './trayManager'
import { getSettings } from './store'
import { registerGlobalShortcut } from './shortcutManager'
import { setupAppMenu } from './appMenu'

function appIconPath(): string {
  const file = process.platform === 'darwin' ? 'icon.icns' : process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  if (app.isPackaged) {
    return join(process.resourcesPath, 'assets', file)
  }
  return join(app.getAppPath(), 'assets', file)
}

app.setName('TimerPromodo')

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showMainAnimated()
  })
}

app.on('ready', async () => {
  app.setAboutPanelOptions({
    applicationName: 'TimerPromodo',
    applicationVersion: app.getVersion(),
    version: app.getVersion(),
    iconPath: appIconPath()
  })
  if (process.platform === 'darwin' && app.dock) {
    const icon = nativeImage.createFromPath(appIconPath())
    if (!icon.isEmpty()) {
      app.dock.setIcon(icon)
    } else {
      log.warn('Dock icon image missing', appIconPath())
    }
  }

  initCrashReporter()
  attachGlobalErrorHandlers()

  const settings = getSettings()
  if (settings.appearance.theme === 'system') {
    nativeTheme.themeSource = 'system'
  } else if (settings.appearance.theme === 'light') {
    nativeTheme.themeSource = 'light'
  } else {
    nativeTheme.themeSource = 'dark'
  }

  registerIpcHandlers()
  setupAppMenu()
  const win = createMainWindow()
  bindAutoUpdater(win)
  setupAutoUpdater()
  scheduleUpdateChecks()
  timerController.init()
  initTray()
  registerGlobalShortcut()

  win.once('ready-to-show', () => {
    win.show()
  })

  log.info('Application ready', { version: app.getVersion() })
  await maybePromptCrashRecovery()
})

app.on('window-all-closed', () => {
  /* Tray keeps the app running; quit from menu only */
})

app.on('before-quit', () => {
  timerController.shutdown()
})

app.on('activate', () => {
  if (getMainWindow() === null) {
    createMainWindow()
  }
})
