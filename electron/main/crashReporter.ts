import { app, crashReporter, dialog, shell } from 'electron'
import { join } from 'node:path'
import log from 'electron-log/main'
import { appStore } from './store'

export function initCrashReporter(): void {
  const crashPath = join(app.getPath('userData'), 'crashes')
  crashReporter.start({
    productName: app.getName(),
    uploadToServer: false,
    compress: true,
    globalExtra: {
      app: app.getName(),
      version: app.getVersion()
    }
  })

  log.transports.file.level = 'debug'
  log.transports.file.resolvePathFn = () =>
    join(app.getPath('userData'), 'logs', 'main.log')
  log.transports.file.archiveLogFn = (oldLogFile) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    return `${oldLogFile}.${stamp}.bak`
  }
  log.info('Crash reporter initialized', { crashPath })
}

export function logIpc(channel: string, direction: 'in' | 'out'): void {
  log.debug(`ipc:${direction}`, channel)
}

export function attachGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error) => {
    log.error('uncaughtException', error)
    appStore.set('crashPending', true)
  })
  process.on('unhandledRejection', (reason) => {
    log.error('unhandledRejection', reason)
  })
}

export async function maybePromptCrashRecovery(): Promise<void> {
  if (!appStore.get('crashPending')) {
    return
  }
  appStore.set('crashPending', false)
  const res = await dialog.showMessageBox({
    type: 'warning',
    message: 'TimerPromodo did not shut down cleanly last time.',
    detail: 'Open the log file to share details when reporting an issue.',
    buttons: ['View log', 'Close'],
    defaultId: 0,
    cancelId: 1
  })
  if (res.response === 0) {
    await shell.openPath(log.transports.file.getFile().path)
  }
}

export function markCrashPendingForNextLaunch(): void {
  appStore.set('crashPending', true)
}
