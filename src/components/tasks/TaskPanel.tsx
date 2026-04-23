import { useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskItem } from '@/components/tasks/TaskItem'
import { useTaskStore } from '@/stores/taskStore'
import { Card } from '@/components/ui/Card'
import type { TaskItem as TaskModel } from '@/lib/schemas'

export function TaskPanel(): JSX.Element {
  const tasks = useTaskStore((s) => s.tasks)
  const activeId = useTaskStore((s) => s.activeTaskId)
  const upsert = useTaskStore((s) => s.upsert)
  const setActive = useTaskStore((s) => s.setActive)
  const remove = useTaskStore((s) => s.remove)

  const sorted = useMemo(
    () => [...tasks].sort((a, b) => a.order - b.order),
    [tasks]
  )

  return (
    <Card className="h-full space-y-3">
      <div className="text-sm font-semibold">Tasks</div>
      <TaskForm
        onCreate={(values) => {
          const task: TaskModel = {
            id: crypto.randomUUID(),
            title: values.title,
            estimatedPomodoros: values.estimatedPomodoros,
            priority: values.priority,
            completed: false,
            actualPomodoros: 0,
            order: tasks.length
          }
          upsert(task)
        }}
      />
      <div className="space-y-2">
        <AnimatePresence>
          {sorted.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              active={t.id === activeId}
              onActivate={() => setActive(t.id)}
              onComplete={() => remove(t.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </Card>
  )
}
