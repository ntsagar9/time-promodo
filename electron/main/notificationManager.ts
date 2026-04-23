import { Notification, app } from 'electron'
import log from 'electron-log/main'
import type { BrowserWindow } from 'electron'
import { getMainWindow } from './windowManager'
import type { AccentId } from '../../src/lib/schemas'

let mainWindow: BrowserWindow | null = null

export function bindNotifications(win: BrowserWindow | null): void {
  mainWindow = win
}

function showNative(
  title: string,
  body: string,
  silent: boolean,
  onClick?: () => void
): void {
  if (!Notification.isSupported()) {
    log.warn('Notifications not supported')
    return
  }
  const n = new Notification({
    title,
    body,
    silent
  })
  n.on('click', () => {
    onClick?.()
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.show()
      mainWindow.focus()
    }
  })
  n.show()
}

export function notifySessionComplete(doNotDisturb: boolean): void {
  showNative('Focus session complete', 'Time for a well-earned break.', doNotDisturb)
}

export function notifyBreakEnd(doNotDisturb: boolean): void {
  showNative('Break finished', 'Ready when you are — start your next focus block.', doNotDisturb)
}

export function notifyPreWarning(
  minutes: number,
  doNotDisturb: boolean
): void {
  showNative(
    'Focus wrapping up',
    `${minutes} minutes left in this session.`,
    doNotDisturb
  )
}

export function notifyDailyGoal(goal: number, doNotDisturb: boolean): void {
  showNative(
    'Daily goal reached',
    `You completed ${goal} sessions today. Outstanding focus.`,
    doNotDisturb
  )
}

export function notifyStreak(days: number, doNotDisturb: boolean): void {
  showNative(
    'Streak milestone',
    `${days} day streak — momentum is building.`,
    doNotDisturb
  )
}

export function notifyNaturalBreakNudge(doNotDisturb: boolean): void {
  const body = 'Hey, you earned that break! 🌿 Take it.'
  showNative('Break reminder', body, doNotDisturb)
  getMainWindow()?.webContents.send('toast:nudge', { message: body })
}

function colorEmoji(color: AccentId): string {
  if (color === 'tomato' || color === 'sunset' || color === 'pink') {
    return '🔴'
  }
  if (color === 'ocean') {
    return '🔵'
  }
  if (color === 'forest') {
    return '🟢'
  }
  return '🟣'
}

export function notifySessionCompleteDetailed(args: {
  doNotDisturb: boolean
  presetName: string
  minutes: number
  color: AccentId
}): void {
  const body = `${colorEmoji(args.color)} ${args.presetName} • ${args.minutes}m complete. Time for a break.`
  showNative('Focus session complete', body, args.doNotDisturb)
}

export function notifyBreakEndDetailed(args: {
  doNotDisturb: boolean
  presetName: string
  nextWorkMinutes: number
  color: AccentId
}): void {
  const body = `${colorEmoji(args.color)} ${args.presetName} • next focus block: ${args.nextWorkMinutes}m.`
  showNative('Break finished', body, args.doNotDisturb)
}

export function notifyPreWarningDetailed(args: {
  minutesLeft: number
  doNotDisturb: boolean
  presetName: string
  color: AccentId
}): void {
  const body = `${colorEmoji(args.color)} ${args.presetName} • ${args.minutesLeft} minute(s) left in this session.`
  showNative('Focus wrapping up', body, args.doNotDisturb)
}

export function requestNotificationPermission(): void {
  if (process.platform === 'darwin') {
    void app.requestSingleInstanceLock()
  }
}
