import { autoUpdater } from 'electron-updater'
import log from 'electron-log/main'
import type { BrowserWindow } from 'electron'

let mainWindow: BrowserWindow | null = null

export function bindAutoUpdater(win: BrowserWindow | null): void {
  mainWindow = win
}

export function setupAutoUpdater(): void {
  autoUpdater.autoDownload = false
  autoUpdater.logger = log

  autoUpdater.on('update-available', (info) => {
    log.info('update-available', info.version)
    mainWindow?.webContents.send('update:available', { version: info.version })
  })

  autoUpdater.on('download-progress', (p) => {
    mainWindow?.webContents.send('update:progress', { percent: p.percent })
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update:ready', {})
  })

  autoUpdater.on('error', (err) => {
    log.warn('autoUpdater error', err)
  })
}

export async function checkForUpdatesManual(): Promise<void> {
  try {
    await autoUpdater.checkForUpdates()
  } catch (e) {
    log.warn('checkForUpdates failed', e)
  }
}

export function scheduleUpdateChecks(): void {
  const run = (): void => {
    void autoUpdater.checkForUpdates()
  }
  setTimeout(run, 5000)
  setInterval(run, 4 * 60 * 60 * 1000)
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall(false, true)
}
