import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'

function formatAcceleratorLabel(accel: string): string {
  const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
  return accel
    .split('+')
    .map((part) => {
      if (part === 'CommandOrControl') {
        return isMac ? '⌘' : 'Ctrl'
      }
      if (part === 'Command') {
        return '⌘'
      }
      if (part === 'Control') {
        return 'Ctrl'
      }
      if (part === 'Shift') {
        return '⇧'
      }
      if (part === 'Alt') {
        return isMac ? '⌥' : 'Alt'
      }
      if (part === 'Space') {
        return 'Space'
      }
      if (part === 'Right') {
        return '→'
      }
      if (part === 'Left') {
        return '←'
      }
      if (part === 'Comma') {
        return ','
      }
      return part
    })
    .join('')
}

function normalizeAccelerator(e: KeyboardEvent): string | null {
  if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    return null
  }
  const parts: string[] = []
  if (e.metaKey || e.ctrlKey) {
    parts.push('CommandOrControl')
  }
  if (e.altKey) {
    parts.push('Alt')
  }
  if (e.shiftKey) {
    parts.push('Shift')
  }
  let key = e.code
  if (key === 'Space') {
    key = 'Space'
  } else if (key.startsWith('Key')) {
    key = key.slice(3)
  } else if (key.startsWith('Digit')) {
    key = key.slice(5)
  } else if (key === 'Comma') {
    key = 'Comma'
  } else if (key === 'Period') {
    key = 'Period'
  } else if (key === 'Slash') {
    key = 'Slash'
  } else if (key === 'ArrowRight') {
    key = 'Right'
  } else if (key === 'ArrowLeft') {
    key = 'Left'
  }
  parts.push(key)
  return parts.join('+')
}

/** Capture mode for global start / pause shortcut. // DONE */
export function GlobalShortcutCapture({ current }: { current: string }): JSX.Element {
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!capturing) {
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setCapturing(false)
        setError(null)
        return
      }
      e.preventDefault()
      e.stopPropagation()
      const accel = normalizeAccelerator(e)
      if (!accel) {
        setError('Include Command/Ctrl, Alt, or Shift')
        return
      }
      void window.tpromodo.shortcuts.register(accel).then((res) => {
        if (res.ok) {
          setCapturing(false)
          setError(null)
          void useSettingsStore.getState().hydrate()
        } else {
          setError('Could not register shortcut')
        }
      })
    },
    [capturing]
  )

  useEffect(() => {
    if (!capturing) {
      return
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [capturing, onKeyDown])

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs">
        <span className="text-muted/80">{current}</span>
        <span className="mx-2 text-muted">·</span>
        <span>{formatAcceleratorLabel(current)}</span>
      </div>
      <Button
        type="button"
        variant={capturing ? 'primary' : 'ghost'}
        className="w-full"
        onClick={() => {
          setError(null)
          setCapturing((c) => !c)
        }}
      >
        {capturing ? 'Press new keys… (Esc to cancel)' : 'Change shortcut'}
      </Button>
      {capturing ? (
        <p className="text-xs text-muted">Include at least one modifier.</p>
      ) : null}
      <p className={cn('text-xs text-red-400', !error && 'hidden')}>{error}</p>
    </div>
  )
}
