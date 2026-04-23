import { useEffect, useRef, useState } from 'react'
import { Lock } from 'lucide-react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { BUILT_IN_PRESETS, builtInToCustom } from '@/lib/presets'
import { useEffectiveSettings, scheduleDebouncedSettingsSave } from '@/stores/settingsStore'
import { useTimerStore } from '@/stores/timerStore'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ACCENT_SWATCH } from '@/common/constant'

/** Preset switch with reset confirmation while running. // DONE */
export function PresetSelector(): JSX.Element {
  const settings = useEffectiveSettings()
  const run = useTimerStore((s) => s.runState)
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const doApply = async (id: string): Promise<void> => {
    await window.tpromodo.timer.setPreset(id, true)
    scheduleDebouncedSettingsSave({ currentPresetId: id })
    setPendingPresetId(null)
  }

  const apply = async (id: string): Promise<void> => {
    setOpen(false)
    if (run !== 'idle' && run !== 'paused') {
      setPendingPresetId(id)
      return
    }
    await doApply(id)
  }

  useEffect(() => {
    const onDocDown = (e: MouseEvent): void => {
      const node = rootRef.current
      if (!node) {
        return
      }
      if (e.target instanceof Node && !node.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  return (
    <>
    <div ref={rootRef} className="relative">
        <Button
          variant="ghost"
          className="no-drag rounded-full border border-white/10 bg-white/5 px-4 text-xs hover:bg-white/15"
          onClick={() => setOpen((v) => !v)}
        >
          Preset
        </Button>
        {open ? (
          <div className="no-drag absolute left-0 top-[calc(100%+10px)] z-[140] min-w-[240px] rounded-xl border border-white/10 bg-surface/95 p-2 text-sm shadow-glass backdrop-blur-xl">
          {BUILT_IN_PRESETS.map((p) => (
            <button
              type="button"
              key={p.id}
              className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left outline-none hover:bg-white/5"
              onClick={() => {
                void apply(p.id)
              }}
            >
              <span className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', ACCENT_SWATCH[builtInToCustom(p).color])} />
                <span>{p.name}</span>
              </span>
              <Lock className="h-3 w-3 text-muted" />
            </button>
          ))}
          {settings.customPresets.map((p) => (
            <button
              type="button"
              key={p.id}
              className="w-full cursor-pointer rounded-lg px-2 py-2 text-left outline-none hover:bg-white/5"
              onClick={() => {
                void apply(p.id)
              }}
            >
              <span className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', ACCENT_SWATCH[p.color])} />
                <span>{p.name}</span>
              </span>
            </button>
          ))}
          </div>
        ) : null}
    </div>

    <AlertDialog.Root open={pendingPresetId !== null} onOpenChange={(o) => !o && setPendingPresetId(null)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
        <AlertDialog.Content className="no-drag fixed left-1/2 top-1/2 z-[81] w-[min(100%-2rem,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-surface p-6 shadow-glass">
          <AlertDialog.Title className="text-lg font-semibold">Reset timer to apply?</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted">
            Switching preset will reset the current phase timing.
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="ghost">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                onClick={() => {
                  if (pendingPresetId) {
                    void doApply(pendingPresetId)
                  }
                }}
              >
                Switch preset
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
    </>
  )
}
