import { useMemo } from 'react'
import { useEffectiveSettings } from '@/stores/settingsStore'

export function useThemeClass(): string {
  const settings = useEffectiveSettings()
  return useMemo(() => {
    if (settings.appearance.theme === 'light') {
      return 'theme-light'
    }
    if (settings.appearance.theme === 'amoled') {
      return 'theme-amoled'
    }
    return ''
  }, [settings.appearance.theme])
}
