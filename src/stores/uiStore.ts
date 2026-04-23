import { create } from 'zustand'

interface UiStore {
  settingsOpen: boolean
  shortcutsOpen: boolean
  leftCollapsed: boolean
  rightCollapsed: boolean
  updateBanner: string | null
  setSettingsOpen: (open: boolean) => void
  setShortcutsOpen: (open: boolean) => void
  setLeftCollapsed: (collapsed: boolean) => void
  setRightCollapsed: (collapsed: boolean) => void
  toggleLeft: () => void
  toggleRight: () => void
  setUpdateBanner: (version: string | null) => void
}

export const useUiStore = create<UiStore>((set) => ({
  settingsOpen: false,
  shortcutsOpen: false,
  leftCollapsed: true,
  rightCollapsed: true,
  updateBanner: null,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  setLeftCollapsed: (collapsed) => set({ leftCollapsed: collapsed }),
  setRightCollapsed: (collapsed) => set({ rightCollapsed: collapsed }),
  toggleLeft: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
  toggleRight: () => set((s) => ({ rightCollapsed: !s.rightCollapsed })),
  setUpdateBanner: (version) =>
    set({ updateBanner: version === null ? null : `Update available — v${version}` })
}))
