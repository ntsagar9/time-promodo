import { app, Menu, nativeImage, Tray } from 'electron'
import { join } from 'node:path'
import log from 'electron-log/main'
import type { TimerPhase, TimerRunState } from '../../src/types/timer'
import { getAnalytics, getSettings, getTasks } from './store'
import {
  getMainWindow,
  hideMainAnimated,
  showMainAnimated,
  toggleMiniWindow
} from './windowManager'
import { getPublicTimerSnapshot } from './timerSnapshot'

let tray: Tray | null = null

export interface TrayHandlers {
  toggleRun: () => void
  skip: () => void
}

let trayHandlers: TrayHandlers | null = null

export function registerTrayHandlers(h: TrayHandlers): void {
  trayHandlers = h
}

function assetPath(...segments: string[]): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'assets', ...segments)
  }
  return join(app.getAppPath(), 'assets', ...segments)
}

function loadTrayImage(phase: TimerPhase | 'idle', run: TimerRunState) {
  const active = run === 'running'
  const file =
    phase === 'work' && active
      ? 'trayIconActive.png'
      : phase === 'work'
        ? 'trayIconActive.png'
        : 'trayIcon.png'
  const p = assetPath('tray', file)
  try {
    const img = nativeImage.createFromPath(p)
    if (!img.isEmpty()) {
      return img.resize({ width: 16, height: 16 })
    }
  } catch {
    log.warn('Tray icon missing, using template', p)
  }
  return nativeImage.createEmpty()
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function todaySessionsCount(): number {
  const today = new Date().toDateString()
  return getAnalytics().filter((r) => new Date(r.endedAt).toDateString() === today && r.phase === 'work')
    .length
}

export function initTray(): void {
  if (tray) {
    return
  }
  const icon = loadTrayImage('idle', 'idle')
  tray = new Tray(icon)
  tray.setToolTip('TimerPromodo')

  tray.on('click', () => {
    const win = getMainWindow()
    if (!win) {
      return
    }
    if (win.isVisible()) {
      hideMainAnimated()
    } else {
      showMainAnimated()
    }
  })

  rebuildMenu()
}

export function rebuildMenu(): void {
  if (!tray) {
    return
  }
  const snap = getPublicTimerSnapshot()
  const tasks = getTasks()
  const active = tasks.tasks.find((t) => t.id === tasks.activeTaskId)
  const phaseLabel =
    snap.phase === 'work'
      ? 'Focus'
      : snap.phase === 'shortBreak'
        ? 'Short break'
        : 'Long break'

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: getMainWindow()?.isVisible() ? 'Hide window' : 'Show window',
      click: () => {
        const win = getMainWindow()
        if (!win) {
          return
        }
        if (win.isVisible()) {
          hideMainAnimated()
        } else {
          showMainAnimated()
        }
      }
    },
    { type: 'separator' },
    {
      label: `${phaseLabel} — ${formatClock(snap.remainingSeconds)}`,
      enabled: false
    },
    {
      label: snap.runState === 'running' ? 'Pause' : 'Start',
      click: () => {
        trayHandlers?.toggleRun()
      }
    },
    {
      label: 'Skip phase',
      click: () => {
        trayHandlers?.skip()
      }
    },
    { type: 'separator' },
    {
      label: `Today: ${todaySessionsCount()} sessions`,
      enabled: false
    },
    {
      label: active ? `Task: ${active.title}` : 'No active task',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Mini timer',
      type: 'checkbox',
      checked: getSettings().system.showMiniTimer,
      click: (item) => {
        toggleMiniWindow(item.checked)
      }
    },
    {
      label: 'Settings',
      click: () => {
        showMainAnimated()
        getMainWindow()?.webContents.send('nav:openSettings')
      }
    },
    { type: 'separator' },
    {
      label: 'Quit TimerPromodo',
      click: () => {
        app.quit()
      }
    }
  ]

  tray.setContextMenu(Menu.buildFromTemplate(template))
}

export function updateTray(
  phase: TimerPhase,
  run: TimerRunState,
  remaining: number
): void {
  if (!tray) {
    return
  }
  const idle: TimerPhase | 'idle' = run === 'idle' && remaining > 0 ? 'idle' : phase
  tray.setImage(loadTrayImage(idle === 'idle' ? 'idle' : phase, run))
  const title = getTasks().tasks.find((t) => t.id === getTasks().activeTaskId)?.title
  tray.setToolTip(
    `TimerPromodo — ${formatClock(remaining)}${title ? ` — ${title}` : ''}`
  )
  rebuildMenu()
}
