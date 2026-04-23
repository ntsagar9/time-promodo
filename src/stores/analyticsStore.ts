import { create } from 'zustand'
import type { SessionRecord } from '@/types/analytics'

interface AnalyticsStore {
  sessions: SessionRecord[]
  hydrated: boolean
  hydrate: () => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  sessions: [],
  hydrated: false,
  hydrate: async () => {
    const sessions = await window.tpromodo.analytics.get()
    set({ sessions, hydrated: true })
  }
}))
