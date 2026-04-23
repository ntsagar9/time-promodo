import type { TpromodoApi } from '../../src/types/preload'

declare global {
  interface Window {
    tpromodo: TpromodoApi
  }
}

export {}
