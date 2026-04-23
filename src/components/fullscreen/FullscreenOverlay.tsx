import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

interface OverlayPayload {
  title: string
  subtitle: string
  action: string
  phase: string
}

function isOverlayPayload(raw: unknown): raw is OverlayPayload {
  if (raw === null || typeof raw !== 'object') {
    return false
  }
  const o = raw as Record<string, unknown>
  return (
    typeof o.title === 'string' &&
    typeof o.subtitle === 'string' &&
    typeof o.action === 'string' &&
    typeof o.phase === 'string'
  )
}

export function FullscreenOverlayRoot(): JSX.Element {
  const [payload, setPayload] = useState<OverlayPayload | null>(null)
  const [seconds, setSeconds] = useState(30)
  const [showIdleHint, setShowIdleHint] = useState(false)
  const [themeClass, setThemeClass] = useState<'theme-light' | 'theme-amoled' | ''>('')

  useEffect(() => {
    void window.tpromodo.settings.get().then((s) => {
      if (s.appearance.theme === 'light') {
        setThemeClass('theme-light')
      } else if (s.appearance.theme === 'amoled') {
        setThemeClass('theme-amoled')
      } else if (s.appearance.theme === 'system') {
        setThemeClass(
          window.matchMedia('(prefers-color-scheme: light)').matches ? 'theme-light' : ''
        )
      } else {
        setThemeClass('')
      }
    })
  }, [])

  useEffect(() => {
    const apply = (raw: unknown): void => {
      if (isOverlayPayload(raw)) {
        setPayload(raw)
        setSeconds(30)
        setShowIdleHint(false)
      }
    }

    void window.tpromodo.overlay.getPending().then((pending) => {
      if (pending) {
        apply(pending)
      }
    })

    const off = window.tpromodo.on(window.tpromodo.channels.overlayShow, apply)
    return () => {
      off()
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setShowIdleHint(true), 2500)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!payload) {
      return
    }
    const id = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          void window.tpromodo.overlay.closeWindow()
          return 30
        }
        return s - 1
      })
    }, 1000)
    return () => {
      window.clearInterval(id)
    }
  }, [payload])

  if (!payload) {
    return (
      <div
        className={`${themeClass} flex h-screen flex-col items-center justify-center gap-4 bg-background px-8 text-center text-sm text-muted`}
      >
        <p>Preparing your session summary…</p>
        {showIdleHint ? (
          <>
            <p className="max-w-md text-xs text-muted/80">
              If this screen stays empty, the overlay may have opened before the main process sent
              the event — use Close, or complete a timer phase with fullscreen overlay enabled.
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                void window.tpromodo.overlay.closeWindow()
              }}
            >
              Close overlay
            </Button>
          </>
        ) : null}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${themeClass} flex h-screen flex-col items-center justify-center gap-6 bg-background px-10 text-center text-foreground`}
    >
      <div className="text-xs uppercase tracking-[0.3em] text-muted">TimerPromodo</div>
      <h1 className="text-4xl font-semibold">{payload.title}</h1>
      <p className="max-w-xl text-lg text-muted">{payload.subtitle}</p>
      <div className="flex gap-3">
        <Button
          onClick={() => {
            void window.tpromodo.overlay.closeWindow()
          }}
        >
          Continue
        </Button>
      </div>
      <p className="text-xs text-muted">Auto-dismiss in {seconds}s</p>
    </motion.div>
  )
}
