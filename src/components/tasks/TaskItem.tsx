import { motion } from 'framer-motion'
import { Check, GripVertical } from 'lucide-react'
import type { TaskItem as TaskModel } from '@/lib/schemas'
import { Button } from '@/components/ui/Button'

export function TaskItem({
  task,
  active,
  onActivate,
  onComplete
}: {
  task: TaskModel
  active: boolean
  onActivate: () => void
  onComplete: () => void
}): JSX.Element {
  return (
    <motion.div
      layout
      className={`flex items-center gap-2 rounded-xl border px-2 py-2 text-sm ${
        active ? 'border-accent/60 bg-accent/10' : 'border-white/5 bg-white/5'
      }`}
    >
      <GripVertical className="h-4 w-4 text-muted" />
      <button type="button" className="flex-1 text-left" onClick={onActivate}>
        <div className="font-medium">{task.title}</div>
        <div className="text-xs text-muted">
          {task.actualPomodoros}/{task.estimatedPomodoros} sessions
        </div>
      </button>
      <Button variant="ghost" className="h-8 w-8 px-0" onClick={onComplete}>
        <Check className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}
