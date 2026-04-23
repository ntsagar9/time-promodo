export const IPC_CHANNELS = {
  TIMER_START: 'timer:start',
  TIMER_PAUSE: 'timer:pause',
  TIMER_SKIP: 'timer:skip',
  TIMER_RESET: 'timer:reset',
  TIMER_SET_PRESET: 'timer:setPreset',
  SETTINGS_SAVE: 'settings:save',
  SETTINGS_GET: 'settings:get',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_TOGGLE_MINI: 'window:toggleMini',
  APP_GET_VERSION: 'app:getVersion',
  APP_CHECK_UPDATE: 'app:checkUpdate',
  APP_OPEN_LOGS: 'app:openLogs',
  ANALYTICS_EXPORT: 'analytics:export',
  TASKS_GET: 'tasks:get',
  TASKS_SAVE: 'tasks:save',
  ANALYTICS_APPEND: 'analytics:append',
  ANALYTICS_GET: 'analytics:get',
  TIMER_STATE_GET: 'timer:stateGet',
  TIMER_APPLY_RENDERER: 'timer:applyRenderer',
  DOCK_SET_COUNT: 'dock:setCount',
  CRASH_ACK: 'crash:ack',
  OVERLAY_GET_PENDING: 'overlay:getPending',
  OVERLAY_CLOSE_WINDOW: 'overlay:closeWindow',
  SHORTCUTS_REGISTER: 'shortcuts:register',
  SHELL_OPEN_EXTERNAL: 'shell:openExternal'
} as const

export type IpcInvokeChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export const IPC_EVENTS = {
  TIMER_TICK: 'timer:tick',
  TIMER_PHASE_CHANGE: 'timer:phaseChange',
  UPDATE_AVAILABLE: 'update:available',
  UPDATE_PROGRESS: 'update:progress',
  UPDATE_READY: 'update:ready',
  SETTINGS_CHANGED: 'settings:changed',
  CRASH_DETECTED: 'crash:detected',
  NATURAL_BREAK_NUDGE: 'naturalBreak:nudge',
  TOAST_NUDGE: 'toast:nudge',
  SHORTCUTS_OPEN: 'shortcuts:open'
} as const
