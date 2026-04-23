import { useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { BUILT_IN_PRESETS, builtInToCustom } from '@/lib/presets'
import type { CustomPreset } from '@/types/settings'
import { useEffectiveSettings, useSettingsStore } from '@/stores/settingsStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'
import { accentIds, type AccentId } from '@/lib/schemas'
import { ACCENT_SWATCH } from '@/common/constant'

function numberField(
  label: string,
  min: number,
  max: number
): z.ZodEffects<z.ZodNumber, number, unknown> {
  return z.preprocess(
    (v) => {
      if (typeof v === 'number') {
        return Number.isFinite(v) ? v : undefined
      }
      if (typeof v === 'string') {
        const t = v.trim()
        if (t.length === 0) {
          return undefined
        }
        const n = Number(t)
        return Number.isFinite(n) ? n : undefined
      }
      return undefined
    },
    z
      .number({
        required_error: `${label} is required`,
        invalid_type_error: `${label} must be a number`
      })
      .int(`${label} must be a whole number`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} max is ${max}`)
  )
}

const presetFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(30, 'Name must be less than 30 characters'),
  color: z.enum(accentIds),
  workMinutes: numberField('Work', 1, 120),
  shortBreakMinutes: numberField('Short break', 1, 30),
  longBreakMinutes: numberField('Long break', 5, 60),
  sessionsBeforeLongBreak: numberField('Sessions before long break', 1, 10),
  autoStartBreak: z.boolean(),
  autoStartWork: z.boolean()
})

type PresetForm = z.output<typeof presetFormSchema>
type PresetFormInput = z.input<typeof presetFormSchema>

function emptyDefaults(color: AccentId): PresetForm {
  return {
    name: '',
    color,
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreak: false,
    autoStartWork: false
  }
}

/** Preset CRUD in settings — RHF + Zod, Radix dialogs. // DONE */
export function PresetEditor(): JSX.Element {
  const settings = useEffectiveSettings()
  const [open, setOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomPreset | null>(null)

  const editingPreset = useMemo(() => {
    if (!editingId || isNew) {
      return null
    }
    return settings.customPresets.find((p) => p.id === editingId) ?? null
  }, [editingId, isNew, settings.customPresets])

  const form = useForm<PresetFormInput, unknown, PresetForm>({
    resolver: zodResolver(presetFormSchema),
    defaultValues: emptyDefaults(settings.appearance.accent),
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const openNew = (): void => {
    setIsNew(true)
    setEditingId(null)
    form.reset(emptyDefaults(settings.appearance.accent))
    form.clearErrors()
    setOpen(true)
  }

  const openEdit = (p: CustomPreset): void => {
    setIsNew(false)
    setEditingId(p.id)
    form.reset({
      name: p.name,
      color: p.color ?? settings.appearance.accent,
      workMinutes: p.workMinutes,
      shortBreakMinutes: p.shortBreakMinutes,
      longBreakMinutes: p.longBreakMinutes,
      sessionsBeforeLongBreak: p.sessionsBeforeLongBreak,
      autoStartBreak: p.autoStartBreak,
      autoStartWork: p.autoStartWork
    })
    form.clearErrors()
    setOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const daily = editingPreset?.dailySessionTarget ?? settings.timer.dailySessionTarget
    const saveNow = useSettingsStore.getState().save
    if (isNew) {
      const id = `custom-${crypto.randomUUID()}`
      const created: CustomPreset = {
        id,
        ...values,
        dailySessionTarget: daily
      }
      await saveNow({
        customPresets: [...settings.customPresets, created]
      })
    } else if (editingId) {
      const next = settings.customPresets.map((p) =>
        p.id === editingId ? { ...p, ...values, dailySessionTarget: daily } : p
      )
      await saveNow({ customPresets: next })
      if (settings.currentPresetId === editingId) {
        await window.tpromodo.timer.setPreset(editingId, true)
      }
    }
    setOpen(false)
    setEditingId(null)
    setIsNew(false)
  })

  const confirmDelete = (): void => {
    if (!deleteTarget) {
      return
    }
    const id = deleteTarget.id
    const nextPresets = settings.customPresets.filter((p) => p.id !== id)
    const patch: Record<string, unknown> = { customPresets: nextPresets }
    if (settings.currentPresetId === id) {
      patch.currentPresetId = 'builtin-classic'
      void window.tpromodo.timer.setPreset('builtin-classic', true)
    }
    void useSettingsStore.getState().save(patch)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" className="inline-flex items-center gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" />
          New Preset
        </Button>
      </div>

      <ul className="space-y-2">
        {BUILT_IN_PRESETS.map((b) => {
          const c = builtInToCustom(b)
          return (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  <span className={cn('h-2.5 w-2.5 rounded-full', ACCENT_SWATCH[c.color])} />
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 text-muted" title="Built-in">
                    <Lock className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {c.workMinutes}m work · {c.shortBreakMinutes}m short · {c.longBreakMinutes}m long
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" disabled className="p-2 opacity-40" aria-hidden>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" disabled className="p-2 opacity-40" aria-hidden>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          )
        })}
        {settings.customPresets.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate font-medium">
                <span className={cn('h-2.5 w-2.5 rounded-full', ACCENT_SWATCH[p.color])} />
                <span className="truncate">{p.name}</span>
              </div>
              <div className="text-xs text-muted">
                {p.workMinutes}m work · {p.shortBreakMinutes}m short · {p.longBreakMinutes}m long
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                className="p-2"
                title="Edit"
                onClick={() => openEdit(p)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="p-2 text-red-300 hover:text-red-200"
                title="Delete"
                onClick={() => setDeleteTarget(p)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setEditingId(null)
            setIsNew(false)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
          <Dialog.Content
            className={cn(
              'no-drag fixed left-1/2 top-1/2 z-[61] w-[min(100%-2rem,420px)] -translate-x-1/2 -translate-y-1/2',
              'rounded-2xl border border-white/10 bg-surface p-6 shadow-glass'
            )}
          >
            <Dialog.Title className="mb-4 text-lg font-semibold">
              {isNew ? 'New preset' : 'Edit preset'}
            </Dialog.Title>
            <form className="space-y-3" onSubmit={onSubmit} noValidate>
              <div>
                <label className="mb-1 block text-xs text-muted" htmlFor="preset-name">
                  Name
                </label>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <Input
                      id="preset-name"
                      maxLength={30}
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      onChange={(e) => field.onChange(e.target.value.trimStart())}
                    />
                  )}
                />
                {form.formState.errors.name ? (
                  <p className="mt-1 text-xs text-red-400">{form.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Preset color</label>
                <Controller
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {accentIds.map((a) => (
                        <button
                          key={a}
                          type="button"
                          className={cn(
                            'h-8 w-8 rounded-full border-2 transition',
                            ACCENT_SWATCH[a],
                            field.value === a
                              ? 'border-white ring-2 ring-white scale-110'
                              : 'border-white/20 opacity-90 hover:opacity-100'
                          )}
                          onClick={() => field.onChange(a)}
                          aria-label={`preset-color-${a}`}
                        />
                      ))}
                    </div>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted" htmlFor="preset-work">
                    Work (min)
                  </label>
                  <Controller
                    control={form.control}
                    name="workMinutes"
                    render={({ field }) => (
                      <Input
                        id="preset-work"
                        type="number"
                        value={typeof field.value === 'number' ? field.value : ''}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? undefined : Number(e.target.value)
                          )
                        }
                      />
                    )}
                  />
                  {form.formState.errors.workMinutes ? (
                    <p className="mt-1 text-xs text-red-400">{form.formState.errors.workMinutes.message}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted" htmlFor="preset-short">
                    Short break (min)
                  </label>
                  <Controller
                    control={form.control}
                    name="shortBreakMinutes"
                    render={({ field }) => (
                      <Input
                        id="preset-short"
                        type="number"
                        value={typeof field.value === 'number' ? field.value : ''}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? undefined : Number(e.target.value)
                          )
                        }
                      />
                    )}
                  />
                  {form.formState.errors.shortBreakMinutes ? (
                    <p className="mt-1 text-xs text-red-400">{form.formState.errors.shortBreakMinutes.message}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted" htmlFor="preset-long">
                    Long break (min)
                  </label>
                  <Controller
                    control={form.control}
                    name="longBreakMinutes"
                    render={({ field }) => (
                      <Input
                        id="preset-long"
                        type="number"
                        value={typeof field.value === 'number' ? field.value : ''}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? undefined : Number(e.target.value)
                          )
                        }
                      />
                    )}
                  />
                  {form.formState.errors.longBreakMinutes ? (
                    <p className="mt-1 text-xs text-red-400">{form.formState.errors.longBreakMinutes.message}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted" htmlFor="preset-sessions">
                    Sessions before long
                  </label>
                  <Controller
                    control={form.control}
                    name="sessionsBeforeLongBreak"
                    render={({ field }) => (
                      <Input
                        id="preset-sessions"
                        type="number"
                        value={typeof field.value === 'number' ? field.value : ''}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? undefined : Number(e.target.value)
                          )
                        }
                      />
                    )}
                  />
                  {form.formState.errors.sessionsBeforeLongBreak ? (
                    <p className="mt-1 text-xs text-red-400">
                      {form.formState.errors.sessionsBeforeLongBreak.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                <span className="text-sm">Auto-start breaks</span>
                <Controller
                  control={form.control}
                  name="autoStartBreak"
                  render={({ field }) => (
                    <Toggle checked={!!field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                <span className="text-sm">Auto-start work</span>
                <Controller
                  control={form.control}
                  name="autoStartWork"
                  render={({ field }) => (
                    <Toggle checked={!!field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                {form.formState.errors.root ? (
                  <p className="mr-auto text-xs text-red-400">{form.formState.errors.root.message}</p>
                ) : null}
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
          <AlertDialog.Content className="no-drag fixed left-1/2 top-1/2 z-[71] w-[min(100%-2rem,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-surface p-6 shadow-glass">
            <AlertDialog.Title className="text-lg font-semibold">Delete preset?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted">
              {deleteTarget ? `"${deleteTarget.name}" will be removed.` : null}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button variant="ghost">Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button variant="danger" onClick={confirmDelete}>
                  Delete
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}
