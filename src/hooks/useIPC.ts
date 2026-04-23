import { useEffect } from 'react'

export function useIpcEvent(
  channel: string,
  handler: (payload: unknown) => void
): void {
  useEffect(() => {
    const off = window.tpromodo.on(channel, handler)
    return () => {
      off()
    }
  }, [channel, handler])
}
