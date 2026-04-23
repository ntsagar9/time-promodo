import { useCallback } from 'react'

export function useTimerControls(): {
  start: () => Promise<void>
  pause: () => Promise<void>
  skip: () => Promise<void>
  reset: () => Promise<void>
} {
  const start = useCallback(async () => {
    await window.tpromodo.timer.start()
  }, [])
  const pause = useCallback(async () => {
    await window.tpromodo.timer.pause()
  }, [])
  const skip = useCallback(async () => {
    await window.tpromodo.timer.skip()
  }, [])
  const reset = useCallback(async () => {
    await window.tpromodo.timer.reset()
  }, [])
  return { start, pause, skip, reset }
}
