import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import {
  LayoutGrid,
  Moon,
  PanelLeftClose,
  PanelRightClose,
  Settings,
  SunMedium,
  Minus,
  Square,
  X
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTimerStore, type TimerTickState } from '@/stores/timerStore'
import { useSettingsStore, useEffectiveSettings } from '@/stores/settingsStore'
import { useTaskStore } from '@/stores/taskStore'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useUiStore } from '@/stores/uiStore'
import { useTimerControls } from '@/hooks/useTimer'
import { useSound } from '@/hooks/useSound'
import { TimerRing } from '@/components/timer/TimerRing'
import { TimerDisplay } from '@/components/timer/TimerDisplay'
import { TimerControls } from '@/components/timer/TimerControls'
import { PhaseIndicator } from '@/components/timer/PhaseIndicator'
import { SessionCounter } from '@/components/timer/SessionCounter'
import { PresetSelector } from '@/components/presets/PresetSelector'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { TaskPanel } from '@/components/tasks/TaskPanel'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { phaseDurationsSeconds } from '@/lib/timerEngine'
import { BUILT_IN_PRESETS, builtInToCustom, getPresetById } from '@/lib/presets'
import { randomQuote } from '@/lib/quotes'
import { scheduleDebouncedSettingsSave } from '@/stores/settingsStore'
import type { AccentId } from '@/lib/schemas'

const StatsPanel = lazy(async () => {
  const mod = await import('@/components/analytics/StatsPanel')
  return { default: mod.StatsPanel }
})

const OverlayRoot = lazy(async () =>
  import('@/components/fullscreen/FullscreenOverlay').then((m) => ({
    default: m.FullscreenOverlayRoot
  }))
)

const MiniRoot = lazy(async () =>
  import('@/components/tray/MiniTimer').then((m) => ({ default: m.MiniTimerRoot }))
)

function Shell(): JSX.Element {
  const settings = useEffectiveSettings()
  const hydrateSettings = useSettingsStore((s) => s.hydrate)
  const hydrateTasks = useTaskStore((s) => s.hydrate)
  const hydrateAnalytics = useAnalyticsStore((s) => s.hydrate)
  const applyTick = useTimerStore((s) => s.applyTick)
  const timer = useTimerStore()
  const runState = useTimerStore((s) => s.runState)
  const { start, pause, skip, reset } = useTimerControls()
  const { playPhaseComplete, playUi } = useSound()
  const settingsOpen = useUiStore((s) => s.settingsOpen)
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen)
  const [settingsTab, setSettingsTab] = useState<'timer' | 'presets' | 'notifications' | 'sound' | 'appearance' | 'system' | 'about'>('timer')
  const leftCollapsed = useUiStore((s) => s.leftCollapsed)
  const rightCollapsed = useUiStore((s) => s.rightCollapsed)
  const setLeftCollapsed = useUiStore((s) => s.setLeftCollapsed)
  const setRightCollapsed = useUiStore((s) => s.setRightCollapsed)
  const toggleLeft = useUiStore((s) => s.toggleLeft)
  const toggleRight = useUiStore((s) => s.toggleRight)
  const updateBanner = useUiStore((s) => s.updateBanner)
  const setUpdateBanner = useUiStore((s) => s.setUpdateBanner)

  const [quote] = useState(() => randomQuote())
  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform),
    []
  )

  useEffect(() => {
    void hydrateSettings()
    void hydrateTasks()
    void hydrateAnalytics()
  }, [hydrateAnalytics, hydrateSettings, hydrateTasks])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (runState === 'running') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [runState])

  useEffect(() => {
    const onResize = (): void => {
      const w = window.innerWidth
      const h = window.innerHeight
      if (w < 500) {
        setLeftCollapsed(true)
        setRightCollapsed(true)
        return
      }
      if (h < 650) {
        setLeftCollapsed(true)
        setRightCollapsed(true)
      }
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setLeftCollapsed, setRightCollapsed])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.repeat) {
        return
      }
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault()
        playUi()
        void skip()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [playUi, skip])

  const onTick = useCallback(
    (payload: unknown) => {
      applyTick(payload as TimerTickState)
    },
    [applyTick]
  )

  useEffect(() => {
    const offTick = window.tpromodo.on(window.tpromodo.channels.tick, onTick)
    const offPhase = window.tpromodo.on(window.tpromodo.channels.phaseChange, () => {
      playPhaseComplete()
    })
    const offNav = window.tpromodo.on(window.tpromodo.channels.navOpenSettings, () => {
      setSettingsTab('timer')
      setSettingsOpen(true)
    })
    const offAbout = window.tpromodo.on(window.tpromodo.channels.navOpenAbout, () => {
      setSettingsTab('about')
      setSettingsOpen(true)
    })
    const offUpdate = window.tpromodo.on(window.tpromodo.channels.updateAvailable, (p) => {
      const version = typeof p === 'object' && p !== null && 'version' in p ? String((p as { version?: string }).version) : null
      setUpdateBanner(version)
    })
    void window.tpromodo.timer.getState().then((snap) => {
      const cur = useTimerStore.getState()
      applyTick({
        ...cur,
        phase: snap.phase,
        runState: snap.runState,
        remainingSeconds: snap.remainingSeconds,
        presetId: snap.presetId,
        dailySessionTarget: settings.timer.dailySessionTarget
      })
    })
    return () => {
      offTick()
      offPhase()
      offNav()
      offAbout()
      offUpdate()
    }
  }, [onTick, playPhaseComplete, setSettingsOpen, setUpdateBanner, applyTick, settings.timer.dailySessionTarget])

  const preset = useMemo(() => {
    return (
      getPresetById(settings.currentPresetId, settings.customPresets) ??
      builtInToCustom(BUILT_IN_PRESETS[0]!)
    )
  }, [settings.currentPresetId, settings.customPresets])

  const totalSeconds = phaseDurationsSeconds(preset)[timer.phase]
  const presetColor: AccentId = preset.color ?? settings.appearance.accent

  const toggleTheme = (): void => {
    const next = settings.appearance.theme === 'dark' ? 'light' : 'dark'
    scheduleDebouncedSettingsSave({ appearance: { ...settings.appearance, theme: next } })
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="drag flex h-12 items-center justify-between border-b border-white/5 px-3">
        <div className={`no-drag flex items-center gap-2 ${isMac ? 'pl-20' : ''}`}>
          <PresetSelector />
        </div>
        <div className="no-drag flex items-center gap-2">
          <Button variant="ghost" className="h-9 w-9 rounded-full px-0" onClick={toggleTheme}>
            {settings.appearance.theme === 'light' ? <Moon size={16} /> : <SunMedium size={16} />}
          </Button>
          <Button
            variant="ghost"
            className="h-9 w-9 rounded-full px-0"
            onClick={() => {
              playUi()
              setSettingsOpen(true)
            }}
          >
            <Settings size={16} />
          </Button>
          <Button variant="ghost" className="h-9 w-9 rounded-full px-0" onClick={() => void toggleLeft()}>
            <PanelLeftClose size={16} />
          </Button>
          <Button variant="ghost" className="h-9 w-9 rounded-full px-0" onClick={() => void toggleRight()}>
            <PanelRightClose size={16} />
          </Button>
        </div>
        {isMac ? (
          <div className="w-20" />
        ) : (
          <div className="no-drag flex items-center gap-1">
            <Button
              variant="ghost"
              className="h-8 w-8 px-0"
              onClick={() => void window.tpromodo.window.minimize()}
            >
              <Minus size={14} />
            </Button>
            <Button
              variant="ghost"
              className="h-8 w-8 px-0"
              onClick={() => void window.tpromodo.window.maximize()}
            >
              <Square size={12} />
            </Button>
            <Button
              variant="ghost"
              className="h-8 w-8 px-0"
              onClick={() => void window.tpromodo.window.close()}
            >
              <X size={14} />
            </Button>
          </div>
        )}
      </div>
      {updateBanner ? (
        <div className="flex items-center justify-between border-b border-white/10 bg-accent/10 px-4 py-2 text-xs">
          <span>{updateBanner}</span>
          <div className="flex gap-2">
            <Button className="h-7 px-3 text-xs" onClick={() => void window.tpromodo.app.checkUpdate()}>
              Download
            </Button>
            <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => setUpdateBanner(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden p-3">
        {!leftCollapsed ? (
          <motion.aside layout className="no-drag w-72 shrink-0 overflow-y-auto">
            <TaskPanel />
          </motion.aside>
        ) : null}
        <main className="no-drag flex min-w-0 flex-1 flex-col items-center justify-center gap-4 overflow-hidden">
          <Card className="w-full max-w-xl space-y-3 p-8 text-center shadow-glass">
            <PhaseIndicator phase={timer.phase} />
            <div className="space-y-0">
              <TimerRing
                totalSeconds={totalSeconds}
                remainingSeconds={timer.remainingSeconds}
                running={timer.runState === 'running'}
                color={presetColor}
              />
              <TimerDisplay seconds={timer.remainingSeconds} color={presetColor} />
            </div>
            <p className="text-sm text-muted">
              {timer.phase === 'work' ? 'Protect your attention.' : quote}
            </p>
            <p className="text-xs font-medium text-muted">Preset: {preset.name}</p>
            <TimerControls
              running={timer.runState === 'running'}
              onStart={() => {
                playUi()
                void start()
              }}
              onPause={() => {
                playUi()
                void pause()
              }}
              onSkip={() => {
                playUi()
                void skip()
              }}
              onReset={() => {
                playUi()
                void reset()
              }}
            />
            <SessionCounter completedInCycle={timer.completedWorkSessionsInCycle} />
            <div className="text-xs text-muted">
              Today {timer.todayCompletedSessions}/{timer.dailySessionTarget} · Focus score{' '}
              {timer.focusScoreToday}
            </div>
            <div className="text-[11px] text-muted">
              Tip: second button skips to next phase. Timer length comes from preset (Classic is
              25:00).
            </div>
          </Card>
        </main>
        {!rightCollapsed ? (
          <motion.aside layout className="no-drag w-80 shrink-0 overflow-y-auto">
            <Suspense
              fallback={<div className="text-xs text-muted">Loading analytics…</div>}
            >
              <StatsPanel />
            </Suspense>
          </motion.aside>
        ) : null}
      </div>
      <div className="no-drag border-t border-white/5 px-4 py-2 text-xs text-muted">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <LayoutGrid className="h-3 w-3" />
            Mini-map: left tasks · center timer · right analytics
          </span>
          <span>Cmd/Ctrl + ? shortcuts (coming soon)</span>
        </div>
      </div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} initialTab={settingsTab} />
    </div>
  )
}

export default function App(): JSX.Element {
  const hash = window.location.hash
  if (hash === '#overlay') {
    return (
      <Suspense fallback={<div className="p-6 text-sm text-muted">Loading overlay…</div>}>
        <OverlayRoot />
      </Suspense>
    )
  }
  if (hash === '#mini') {
    return (
      <Suspense fallback={<div className="p-3 text-xs text-muted">Loading…</div>}>
        <MiniRoot />
      </Suspense>
    )
  }
  return <Shell />
}
