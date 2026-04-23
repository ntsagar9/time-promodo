import { Menu, shell } from 'electron'
import { getMainWindow, hideMainAnimated, showMainAnimated } from './windowManager'

export function setupAppMenu(): void {
  const isMac = process.platform === 'darwin'
  const appLabel = 'TimerPromodo'

  const openAbout = (): void => {
    showMainAnimated()
    getMainWindow()?.webContents.send('nav:openAbout')
  }

  const appSubmenu: Electron.MenuItemConstructorOptions[] = [
    {
      label: `About ${appLabel}`,
      click: () => openAbout()
    },
    { type: 'separator' },
    { role: 'services' },
    { type: 'separator' },
    { role: 'hide' },
    { role: 'hideOthers' },
    { role: 'unhide' },
    { type: 'separator' },
    { role: 'quit' }
  ]

  const fileSubmenu: Electron.MenuItemConstructorOptions[] = [
    {
      label: `About ${appLabel}`,
      click: () => openAbout()
    },
    { type: 'separator' },
    {
      label: 'Show Window',
      click: () => showMainAnimated()
    },
    {
      label: 'Hide Window',
      click: () => hideMainAnimated()
    },
    {
      label: 'Open Settings',
      accelerator: isMac ? 'Command+,' : 'Ctrl+,',
      click: () => {
        showMainAnimated()
        getMainWindow()?.webContents.send('nav:openSettings')
      }
    },
    { type: 'separator' },
    isMac ? { role: 'close' } : { role: 'quit' }
  ]

  const editSubmenu: Electron.MenuItemConstructorOptions[] = [
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { role: 'selectAll' }
  ]

  const viewSubmenu: Electron.MenuItemConstructorOptions[] = [
    { role: 'reload' },
    { role: 'forceReload' },
    { role: 'toggleDevTools' },
    { type: 'separator' },
    { role: 'resetZoom' },
    { role: 'zoomIn' },
    { role: 'zoomOut' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  ]

  const windowSubmenu: Electron.MenuItemConstructorOptions[] = [
    { role: 'minimize' },
    { role: 'zoom' },
    ...(isMac ? [{ role: 'front' as const }] : [{ role: 'close' as const }])
  ]

  const helpSubmenu: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'GitHub Repository',
      click: () => {
        void shell.openExternal('https://github.com/ntsagar9/time-promodo')
      }
    },
    {
      label: 'Report an Issue',
      click: () => {
        void shell.openExternal('https://github.com/ntsagar9/time-promodo/issues')
      }
    }
  ]

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: appLabel,
            submenu: appSubmenu
          }
        ]
      : []),
    {
      label: 'File',
      submenu: fileSubmenu
    },
    {
      label: 'Edit',
      submenu: editSubmenu
    },
    {
      label: 'View',
      submenu: viewSubmenu
    },
    {
      label: 'Window',
      submenu: windowSubmenu
    },
    {
      label: 'Help',
      submenu: helpSubmenu
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
