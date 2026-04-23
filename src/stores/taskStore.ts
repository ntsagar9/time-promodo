import { create } from 'zustand'
import type { TaskItem } from '@/lib/schemas'

interface TaskStore {
  tasks: TaskItem[]
  activeTaskId: string | null
  hydrated: boolean
  hydrate: () => Promise<void>
  setActive: (id: string | null) => void
  upsert: (task: TaskItem) => void
  remove: (id: string) => void
  reorder: (orderedIds: string[]) => void
  persist: () => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  activeTaskId: null,
  hydrated: false,
  hydrate: async () => {
    const data = await window.tpromodo.tasks.get()
    set({
      tasks: data.tasks,
      activeTaskId: data.activeTaskId,
      hydrated: true
    })
  },
  setActive: (id) => {
    set({ activeTaskId: id })
    void get().persist()
  },
  upsert: (task) => {
    const exists = get().tasks.some((t) => t.id === task.id)
    const tasks = exists
      ? get().tasks.map((t) => (t.id === task.id ? task : t))
      : [...get().tasks, task].sort((a, b) => a.order - b.order)
    set({ tasks })
    void get().persist()
  },
  remove: (id) => {
    set({
      tasks: get().tasks.filter((t) => t.id !== id),
      activeTaskId: get().activeTaskId === id ? null : get().activeTaskId
    })
    void get().persist()
  },
  reorder: (orderedIds) => {
    const map = new Map(get().tasks.map((t) => [t.id, t]))
    const tasks = orderedIds
      .map((id, index) => {
        const t = map.get(id)
        return t ? { ...t, order: index } : null
      })
      .filter((t): t is TaskItem => t !== null)
    set({ tasks })
    void get().persist()
  },
  persist: async () => {
    const { tasks, activeTaskId } = get()
    await window.tpromodo.tasks.save({ tasks, activeTaskId })
  }
}))
