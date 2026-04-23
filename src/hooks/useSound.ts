import { useCallback } from 'react'
import { playSessionChime, playUiClick } from '@/lib/soundEngine'
import { useEffectiveSettings } from '@/stores/settingsStore'

export function useSound(): {
  playPhaseComplete: () => void
  playUi: () => void
} {
  const settings = useEffectiveSettings()
  const playPhaseComplete = useCallback(() => {
    if (settings.sound.theme === 'none') {
      return
    }
    playSessionChime(settings.sound.theme, settings.sound.masterVolume)
  }, [settings.sound.masterVolume, settings.sound.theme])
  const playUi = useCallback(() => {
    if (!settings.sound.uiClicks) {
      return
    }
    playUiClick(settings.sound.masterVolume)
  }, [settings.sound.masterVolume, settings.sound.uiClicks])
  return { playPhaseComplete, playUi }
}
