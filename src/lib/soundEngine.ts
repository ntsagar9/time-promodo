let audioCtx: AudioContext | null = null

function ctx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

export function playUiClick(volume: number): void {
  const c = ctx()
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.value = 880
  g.gain.value = Math.max(0.0001, volume / 1000)
  o.connect(g)
  g.connect(c.destination)
  o.start()
  o.stop(c.currentTime + 0.04)
}

export function playSessionChime(theme: string, master: number): void {
  const c = ctx()
  const g = c.createGain()
  g.gain.value = Math.max(0.0001, master / 400)
  const o = c.createOscillator()
  o.type = theme === 'digital' ? 'square' : 'triangle'
  o.frequency.value = theme === 'zen' ? 528 : 660
  o.connect(g)
  g.connect(c.destination)
  o.start()
  o.stop(c.currentTime + 0.25)
}
