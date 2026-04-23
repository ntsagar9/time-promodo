import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  title: z.string().min(1).max(200),
  estimatedPomodoros: z.coerce.number().min(1).max(50),
  priority: z.enum(['high', 'medium', 'low'])
})

type Form = z.infer<typeof schema>

export function TaskForm({ onCreate }: { onCreate: (values: Form) => void }): JSX.Element {
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', estimatedPomodoros: 1, priority: 'medium' }
  })
  return (
    <form
      className="space-y-2"
      onSubmit={form.handleSubmit((v) => {
        onCreate(v)
        form.reset({ title: '', estimatedPomodoros: 1, priority: 'medium' })
      })}
    >
      <Input placeholder="New task" {...form.register('title')} />
      <div className="flex gap-2">
        <Input type="number" className="w-24" {...form.register('estimatedPomodoros')} />
        <select
          className="flex-1 rounded-xl border border-white/10 bg-black/20 px-2 text-sm"
          {...form.register('priority')}
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <Button type="submit" className="shrink-0">
          Add
        </Button>
      </div>
    </form>
  )
}
