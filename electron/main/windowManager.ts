import {
  app,
  BrowserWindow,
  screen,
  shell,
  type BrowserWindowConstructorOptions
} from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import log from 'electron-log/main'
import { getSettings } from './store'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function rendererUrl(): string | undefined {
  return process.env.ELECTRON_RENDERER_URL
}

function preloadPath(): string {
  return join(__dirname, '../preload/index.js')
}

function appWindowIconPath(): string {
  const file =
    process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png'
  if (app.isPackaged) {
    return join(process.resourcesPath, 'assets', file)
  }
  return join(app.getAppPath(), 'assets', file)
}

export let mainWindow: BrowserWindow | null = null
export let overlayWindow: BrowserWindow | null = null
export let miniWindow: BrowserWindow | null = null

let pendingOverlayPayload: Record<string, unknown> | null = null

export function getPendingOverlayPayload(): Record<string, unknown> | null {
  return pendingOverlayPayload
}

export function clearPendingOverlayPayload(): void {
  pendingOverlayPayload = null
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function createMainWindow(): BrowserWindow {
  const settings = getSettings()
  const compact = settings.appearance.compactMode
  const opts: BrowserWindowConstructorOptions = {
    width: compact ? 400 : 420,
    height: compact ? 620 : 680,
    minWidth: 400,
    minHeight: 600,
    show: false,
    icon: appWindowIconPath(),
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 14 },
    backgroundColor: '#0b1220',
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  }
  mainWindow = new BrowserWindow(opts)

  if (isDev && rendererUrl()) {
    void mainWindow.loadURL(rendererUrl()!)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const file = join(__dirname, '../renderer/index.html')
    void mainWindow.loadURL(pathToFileURL(file).toString())
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('blur', () => {
    applyMainTransparency(false)
  })

  mainWindow.on('focus', () => {
    applyMainTransparency(true)
  })

  return mainWindow
}

export function applyMainTransparency(focused: boolean): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  const s = getSettings()
  if (!s.appearance.windowTransparencyUnfocused || focused) {
    mainWindow.setOpacity(1)
    return
  }
  const p = s.appearance.unfocusedWindowOpacity
  mainWindow.setOpacity(Math.max(0.2, Math.min(1, p)))
}

export function showMainAnimated(): void {
  if (!mainWindow) {
    return
  }
  if (!mainWindow.isVisible()) {
    mainWindow.show()
  }
  mainWindow.focus()
}

export function hideMainAnimated(): void {
  mainWindow?.hide()
}

export function createOverlayWindow(): BrowserWindow {
  overlayWindow = new BrowserWindow({
    fullscreen: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    icon: appWindowIconPath(),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev && rendererUrl()) {
    void overlayWindow.loadURL(`${rendererUrl()}#overlay`)
  } else {
    const file = join(__dirname, '../renderer/index.html')
    void overlayWindow.loadURL(`${pathToFileURL(file).toString()}#overlay`)
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })

  return overlayWindow
}

export function showOverlay(payload: Record<string, unknown>): void {
  const settings = getSettings()
  if (!settings.overlay.fullscreenOnPhaseEnd) {
    return
  }
  pendingOverlayPayload = payload
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow()
  }
  const win = overlayWindow
  if (!win) {
    return
  }

  const deliver = (): void => {
    if (win.isDestroyed()) {
      return
    }
    const data = pendingOverlayPayload ?? payload
    win.webContents.send('overlay:show', data)
  }

  if (win.webContents.isLoading()) {
    win.webContents.once('did-finish-load', () => {
      queueMicrotask(deliver)
      setTimeout(deliver, 120)
    })
  } else {
    queueMicrotask(deliver)
    setTimeout(deliver, 120)
  }

  win.setAlwaysOnTop(true, 'screen-saver')
  win.show()
  win.focus()
}

export function hideOverlay(): void {
  clearPendingOverlayPayload()
  overlayWindow?.hide()
}

export function closeOverlayWindow(): void {
  clearPendingOverlayPayload()
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close()
  }
  overlayWindow = null
}

export function createMiniWindow(): BrowserWindow {
  const settings = getSettings()
  miniWindow = new BrowserWindow({
    width: 220,
    height: 88,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    icon: appWindowIconPath(),
    opacity: settings.system.miniTimerOpacity / 100,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev && rendererUrl()) {
    void miniWindow.loadURL(`${rendererUrl()}#mini`)
  } else {
    const file = join(__dirname, '../renderer/index.html')
    void miniWindow.loadURL(`${pathToFileURL(file).toString()}#mini`)
  }

  miniWindow.setIgnoreMouseEvents(false)

  miniWindow.on('closed', () => {
    miniWindow = null
  })

  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  miniWindow.setPosition(width - 240, height - 120)

  return miniWindow
}

export function toggleMiniWindow(show: boolean): void {
  if (show) {
    if (!miniWindow || miniWindow.isDestroyed()) {
      createMiniWindow()
    }
    miniWindow?.show()
  } else {
    miniWindow?.hide()
  }
}

export function setMiniOpacity(value: number): void {
  miniWindow?.setOpacity(Math.max(0.2, Math.min(1, value / 100)))
}

log.info('windowManager module loaded')
