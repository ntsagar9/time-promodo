import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import {
  useSettingsStore,
  scheduleDebouncedSettingsSave,
  applyAppearanceLive
} from '@/stores/settingsStore'
import { PresetEditor } from '@/components/presets/PresetEditor'
import { GlobalShortcutCapture } from '@/components/settings/GlobalShortcutCapture'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Slider } from '@/components/ui/Slider'
import { accentIds, appThemes, soundThemes, ambientSounds } from '@/lib/schemas'
import { ACCENT_SWATCH } from '@/common/constant'

const timerSchema = z.object({
  workMinutes: z.coerce.number().min(1).max(120),
  shortBreakMinutes: z.coerce.number().min(1).max(30),
  longBreakMinutes: z.coerce.number().min(5).max(60),
  sessionsBeforeLongBreak: z.coerce.number().min(1).max(10),
  dailySessionTarget: z.coerce.number().min(1).max(20),
  autoStartBreak: z.boolean(),
  autoStartWork: z.boolean(),
  resumeOnRestart: z.boolean()
})

type TimerForm = z.infer<typeof timerSchema>

export function SettingsModal({
  open,
  onOpenChange,
  initialTab = 'timer'
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: 'timer' | 'presets' | 'notifications' | 'sound' | 'appearance' | 'system' | 'about'
}): JSX.Element {
  const settings = useSettingsStore((s) => s.settings)
  const [activeTab, setActiveTab] = useState(initialTab)

  const form = useForm<TimerForm>({
    resolver: zodResolver(timerSchema),
    defaultValues: {
      workMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4,
      dailySessionTarget: 8,
      autoStartBreak: false,
      autoStartWork: false,
      resumeOnRestart: true
    },
    values: settings
      ? {
          workMinutes: settings.timer.workMinutes,
          shortBreakMinutes: settings.timer.shortBreakMinutes,
          longBreakMinutes: settings.timer.longBreakMinutes,
          sessionsBeforeLongBreak: settings.timer.sessionsBeforeLongBreak,
          dailySessionTarget: settings.timer.dailySessionTarget,
          autoStartBreak: settings.timer.autoStartBreak,
          autoStartWork: settings.timer.autoStartWork,
          resumeOnRestart: settings.timer.resumeOnRestart
        }
      : undefined
  })

  useEffect(() => {
    if (open) {
      void useSettingsStore.getState().hydrate()
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
    }
  }, [initialTab, open])

  const onSaveTimer = form.handleSubmit((values) => {
    scheduleDebouncedSettingsSave({ timer: { ...settings!.timer, ...values } })
  })

  if (!settings) {
    return <div />
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/10 bg-surface/95 shadow-glass backdrop-blur-xl md:w-full">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <Dialog.Title className="text-lg font-semibold">Settings</Dialog.Title>
            <Dialog.Close className="rounded-full p-2 hover:bg-white/5">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex min-h-0 flex-1 flex-col">
            <Tabs.List className="no-drag flex gap-2 overflow-x-auto border-b border-white/10 px-3 py-2 text-xs md:px-4">
              {['timer', 'presets', 'notifications', 'sound', 'appearance', 'system', 'about'].map(
                (t) => (
                  <Tabs.Trigger
                    key={t}
                    value={t}
                    className="rounded-full px-3 py-1 capitalize text-muted data-[state=active]:bg-accent data-[state=active]:text-white"
                  >
                    {t}
                  </Tabs.Trigger>
                )
              )}
            </Tabs.List>
            <div className="no-drag min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
              <Tabs.Content value="timer" className="space-y-4">
                <form className="space-y-4" onSubmit={onSaveTimer}>
                  <label className="text-xs text-muted">Work minutes</label>
                  <Input type="number" {...form.register('workMinutes')} />
                  <label className="text-xs text-muted">Short break</label>
                  <Input type="number" {...form.register('shortBreakMinutes')} />
                  <label className="text-xs text-muted">Long break</label>
                  <Input type="number" {...form.register('longBreakMinutes')} />
                  <label className="text-xs text-muted">Sessions before long break</label>
                  <Input type="number" {...form.register('sessionsBeforeLongBreak')} />
                  <label className="text-xs text-muted">Daily goal</label>
                  <Input type="number" {...form.register('dailySessionTarget')} />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-start breaks</span>
                    <Toggle
                      checked={form.watch('autoStartBreak')}
                      onCheckedChange={(v) => form.setValue('autoStartBreak', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-start work</span>
                    <Toggle
                      checked={form.watch('autoStartWork')}
                      onCheckedChange={(v) => form.setValue('autoStartWork', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Resume on restart</span>
                    <Toggle
                      checked={form.watch('resumeOnRestart')}
                      onCheckedChange={(v) => form.setValue('resumeOnRestart', v)}
                    />
                  </div>
                  <Button type="submit">Save timer</Button>
                </form>
              </Tabs.Content>
              <Tabs.Content value="presets" className="space-y-4 text-sm">
                <PresetEditor />
              </Tabs.Content>
              <Tabs.Content value="notifications" className="space-y-3 text-sm">
                <RowToggle
                  label="Session end"
                  checked={settings.notifications.sessionEnd}
                  onChange={(v) => scheduleDebouncedSettingsSave({ notifications: { ...settings.notifications, sessionEnd: v } })}
                />
                <RowToggle
                  label="Break end"
                  checked={settings.notifications.breakEnd}
                  onChange={(v) => scheduleDebouncedSettingsSave({ notifications: { ...settings.notifications, breakEnd: v } })}
                />
                <RowToggle
                  label="Pre-warning"
                  checked={settings.notifications.preWarning}
                  onChange={(v) => scheduleDebouncedSettingsSave({ notifications: { ...settings.notifications, preWarning: v } })}
                />
              </Tabs.Content>
              <Tabs.Content value="sound" className="space-y-4 text-sm">
                <div>
                  <div className="mb-2 text-xs text-muted">Master volume</div>
                  <Slider
                    value={[settings.sound.masterVolume]}
                    min={0}
                    max={100}
                    onChange={(v) =>
                      scheduleDebouncedSettingsSave({ sound: { ...settings.sound, masterVolume: v[0] ?? 0 } })
                    }
                  />
                </div>
                <label className="text-xs text-muted">Theme</label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                  value={settings.sound.theme}
                  onChange={(e) =>
                    scheduleDebouncedSettingsSave({
                      sound: { ...settings.sound, theme: e.target.value as typeof settings.sound.theme }
                    })
                  }
                >
                  {soundThemes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <RowToggle
                  label="UI clicks"
                  checked={settings.sound.uiClicks}
                  onChange={(v) => scheduleDebouncedSettingsSave({ sound: { ...settings.sound, uiClicks: v } })}
                />
                <label className="text-xs text-muted">Ambient</label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                  value={settings.sound.ambient}
                  onChange={(e) =>
                    scheduleDebouncedSettingsSave({
                      sound: { ...settings.sound, ambient: e.target.value as typeof settings.sound.ambient }
                    })
                  }
                >
                  {ambientSounds.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div>
                  <div className="mb-2 text-xs text-muted">Ambient volume</div>
                  <Slider
                    value={[settings.sound.ambientVolume]}
                    min={0}
                    max={100}
                    onChange={(v) =>
                      scheduleDebouncedSettingsSave({
                        sound: { ...settings.sound, ambientVolume: v[0] ?? 0 }
                      })
                    }
                  />
                </div>
              </Tabs.Content>
              <Tabs.Content value="appearance" className="space-y-4 text-sm">
                <div>
                  <div className="mb-2 text-xs text-muted">Theme</div>
                  <div className="flex flex-wrap gap-2">
                    {appThemes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`rounded-full px-3 py-1.5 text-xs capitalize transition ${
                          settings.appearance.theme === t
                            ? 'bg-accent text-white shadow-md'
                            : 'bg-white/10 text-muted hover:bg-white/15'
                        }`}
                        onClick={() => applyAppearanceLive({ theme: t })}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs text-muted">Accent</div>
                  <div className="flex flex-wrap gap-2">
                    {accentIds.map((a) => (
                      <button
                        key={a}
                        type="button"
                        title={a}
                        className={`h-9 w-9 rounded-full border-2 transition ${ACCENT_SWATCH[a]} ${
                          settings.appearance.accent === a
                            ? 'border-white scale-110 ring-2 ring-white'
                            : 'border-white/20 opacity-90 hover:opacity-100'
                        }`}
                        onClick={() => applyAppearanceLive({ accent: a })}
                      />
                    ))}
                  </div>
                </div>
                <RowToggle
                  label="Session dots"
                  checked={settings.appearance.showSessionDots}
                  onChange={(v) =>
                    scheduleDebouncedSettingsSave({
                      appearance: { ...settings.appearance, showSessionDots: v }
                    })
                  }
                />
                <RowToggle
                  label="Compact mode"
                  checked={settings.appearance.compactMode}
                  onChange={(v) =>
                    scheduleDebouncedSettingsSave({
                      appearance: { ...settings.appearance, compactMode: v }
                    })
                  }
                />
              </Tabs.Content>
              <Tabs.Content value="system" className="space-y-3 text-sm">
                <RowToggle
                  label="Start at login"
                  checked={settings.system.startAtLogin}
                  onChange={(v) =>
                    scheduleDebouncedSettingsSave({ system: { ...settings.system, startAtLogin: v } })
                  }
                />
                <RowToggle
                  label="Always on top"
                  checked={settings.system.alwaysOnTop}
                  onChange={(v) =>
                    scheduleDebouncedSettingsSave({ system: { ...settings.system, alwaysOnTop: v } })
                  }
                />
                <RowToggle
                  label="Minimize to tray on close"
                  checked={settings.system.minimizeToTrayOnClose}
                  onChange={(v) =>
                    scheduleDebouncedSettingsSave({
                      system: { ...settings.system, minimizeToTrayOnClose: v }
                    })
                  }
                />
                <RowToggle
                  label="Show mini timer"
                  checked={settings.system.showMiniTimer}
                  onChange={(v) =>
                    scheduleDebouncedSettingsSave({ system: { ...settings.system, showMiniTimer: v } })
                  }
                />
                <label className="text-xs text-muted">Mini timer opacity</label>
                <Slider
                  value={[settings.system.miniTimerOpacity]}
                  min={20}
                  max={100}
                  onChange={(v) =>
                    scheduleDebouncedSettingsSave({
                      system: { ...settings.system, miniTimerOpacity: v[0] ?? 80 }
                    })
                  }
                />
                <RowToggle
                  label="Fade window when unfocused"
                  checked={settings.appearance.windowTransparencyUnfocused}
                  onChange={(v) => applyAppearanceLive({ windowTransparencyUnfocused: v })}
                />
                {settings.appearance.windowTransparencyUnfocused ? (
                  <div>
                    <div className="mb-2 text-xs text-muted">Unfocused opacity (0.5–1)</div>
                    <Slider
                      value={[Math.round(settings.appearance.unfocusedWindowOpacity * 100)]}
                      min={50}
                      max={100}
                      step={5}
                      onChange={(v) => {
                        const pct = v[0] ?? 92
                        applyAppearanceLive({
                          unfocusedWindowOpacity: Math.min(1, Math.max(0.5, pct / 100))
                        })
                      }}
                    />
                  </div>
                ) : null}
                <div className="pt-2">
                  <div className="mb-2 text-xs text-muted">Global start / pause shortcut</div>
                  <GlobalShortcutCapture current={settings.system.globalShortcut} />
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="mb-2 text-xs font-semibold text-muted">Shortcut reference</div>
                  <div className="space-y-1 text-xs text-muted">
                    <div className="flex items-center justify-between">
                      <span>Start / Pause (global)</span>
                      <code>Cmd/Ctrl + Shift + Space</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Skip phase (app focused)</span>
                      <code>Cmd/Ctrl + Shift + →</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Reset timer (global)</span>
                      <code>Cmd/Ctrl + Shift + R</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Open settings (global)</span>
                      <code>Cmd/Ctrl + ,</code>
                    </div>
                  </div>
                </div>
              </Tabs.Content>
              <Tabs.Content value="about" className="space-y-3 text-sm">
                <AboutPanel />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function RowToggle({
  label,
  checked,
  onChange
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2">
      <span>{label}</span>
      <Toggle checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function AboutPanel(): JSX.Element {
  const [version, setVersion] = useState<string>('…')
  const [iconFailed, setIconFailed] = useState(false)
  const bmcUrl = 'https://buymeacoffee.com/ntsagar'
  const repoUrl = 'https://github.com/ntsagar9/time-promodo'
  const issuesUrl = 'https://github.com/ntsagar9/time-promodo/issues'

  useEffect(() => {
    void window.tpromodo.app.getVersion().then((v) => setVersion(v.version))
  }, [])

  return (
    <div className="space-y-3">
      <div className="mb-2 rounded-2xl border border-white/10 bg-black/10 p-4 text-center">
        {iconFailed ? (
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/20 text-2xl">
            🍅
          </div>
        ) : (
          <img
            src="/assets/icon.png"
            alt="TimerPromodo app icon"
            className="mx-auto mb-3 h-14 w-14 rounded-xl border border-white/10 bg-black/20 p-1"
            onError={() => setIconFailed(true)}
          />
        )}
        <p className="text-base font-semibold">TimerPromodo</p>
        <p className="text-xs text-muted">Version {version}</p>
      </div>
      <p className="text-sm text-muted">TimerPromodo {version}</p>
      <Button
        variant="ghost"
        onClick={() => {
          void window.tpromodo.app.checkUpdate()
        }}
      >
        Check for updates
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          void window.tpromodo.app.openLogs()
        }}
      >
        View logs
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          void window.tpromodo.shell.openExternal(repoUrl)
        }}
      >
        GitHub repository
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          void window.tpromodo.shell.openExternal(issuesUrl)
        }}
      >
        Report an issue
      </Button>

      <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">☕</span>
          <span className="text-sm font-semibold text-foreground">Enjoying TimerPromodo?</span>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-muted">
          This app is free and open source. If it has helped your focus, a coffee keeps
          development going.
        </p>
        <button
          type="button"
          onClick={() => {
            void window.tpromodo.shell.openExternal(bmcUrl)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-semibold text-yellow-900 transition-colors duration-150 hover:bg-yellow-300"
        >
          <span>☕</span>
          Buy Me a Coffee
        </button>
      </div>
    </div>
  )
}
