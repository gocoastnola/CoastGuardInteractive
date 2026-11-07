/**
 * Tiny WebAudio engine for the adventure. Everything is synthesised — no
 * audio files, nothing hot-linked (see AGENTS.md). All methods are safe
 * no-ops until `enable()` runs inside a user gesture (autoplay policy).
 *
 * Voices:
 *   ambient()  — low nautical drone + filtered-noise "sea wash", loops quietly
 *   tick()     — slot-reel click (pitch follows reel speed)
 *   lock()     — reel lands: low thunk + rising brass triad
 *   horn()     — ship's horn, two detuned lows with a slow swell
 *   whoosh()   — bandpassed noise sweep for departures / transitions
 *   chime()    — port-arrival pluck triad
 *   fanfare()  — homecoming: arpeggio + pad swell
 *
 * Sound starts after user interaction; no mute state.
 */

class Sound {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientNodes: { stop(): void } | null = null
  private scoreTimer: number | null = null
  private scoreMode = ''
  private scoreBeat = 0
  private scoreGain: GainNode | null = null
  get enabled(): boolean {
    return !!this.ctx
  }

  /** Call from a click/keydown handler. Idempotent. */
  enable(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 1
      this.master.connect(this.ctx.destination)
    } catch {
      this.ctx = null
    }
  }

  /* ---------- helpers ---------- */

  private env(at: number, peak: number, attack: number, decay: number): GainNode | null {
    if (!this.ctx || !this.master) return null
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
    g.connect(this.master)
    return g
  }

  private osc(type: OscillatorType, freq: number, at: number, dur: number, out: AudioNode): void {
    if (!this.ctx) return
    const o = this.ctx.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(freq, at)
    o.connect(out)
    o.start(at)
    o.stop(at + dur)
  }

  private noiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null
    const len = this.ctx.sampleRate * 2
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    return buf
  }

  /* ---------- ambient score ---------- */

  /** Starts the quiet nautical bed (drone + sea wash). Safe to call twice. */
  ambient(): void {
    if (!this.ctx || !this.master || this.ambientNodes) return
    const ctx = this.ctx
    const bed = ctx.createGain()
    bed.gain.value = 0.0001
    bed.gain.setTargetAtTime(0.055, ctx.currentTime, 3)
    bed.connect(this.master)

    // Two slow-beating drones a fifth apart (A2 + E3), triangle for softness.
    const stops: Array<() => void> = []
    for (const [f, detune, g] of [
      [110, 2, 0.5],
      [164.8, -3, 0.3],
    ] as const) {
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.value = f
      o.detune.value = detune
      const og = ctx.createGain()
      og.gain.value = g
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 420
      o.connect(og).connect(lp).connect(bed)
      o.start()
      stops.push(() => o.stop())
    }

    // Sea wash: looped noise through a slowly-wandering bandpass.
    const buf = this.noiseBuffer()
    if (buf) {
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.loop = true
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 480
      bp.Q.value = 0.6
      const ng = ctx.createGain()
      ng.gain.value = 0.4
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.07 // slow swells
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.22
      lfo.connect(lfoGain).connect(ng.gain)
      src.connect(bp).connect(ng).connect(bed)
      src.start()
      lfo.start()
      stops.push(() => {
        src.stop()
        lfo.stop()
      })
    }

    this.ambientNodes = {
      stop: () => {
        bed.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.8)
        window.setTimeout(() => stops.forEach((s) => s()), 2500)
      },
    }
  }

  stopAmbient(): void {
    this.ambientNodes?.stop()
    this.ambientNodes = null
  }

  /**
   * Original instrumental score, generated in WebAudio without third-party music.
   * The same motif evolves from reflective training to adventurous patrol.
   * Start only after a click has unlocked AudioContext.
   */
  score(mode: 'training' | 'orders' | 'arrival' | 'patrol' | 'explore' | 'off'): void {
    if (mode === this.scoreMode) return
    this.stopScore()
    if (mode === 'off' || !this.ctx || !this.master) return
    this.scoreMode = mode
    this.scoreBeat = 0
    const ctx = this.ctx
    const bus = ctx.createGain()
    bus.gain.setValueAtTime(0.0001, ctx.currentTime)
    bus.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 1.4)
    bus.connect(this.master)
    this.scoreGain = bus
    const tempo = mode === 'training' ? 82 : mode === 'orders' ? 92 : mode === 'arrival' ? 104 : mode === 'patrol' ? 112 : 88
    const interval = 60 / tempo
    // Original eight-bar harmonic theme in D major / B minor.
    const chords = [
      [146.83, 220, 293.66], // D
      [123.47, 185.00, 246.94], // Bm
      [98, 146.83, 196], // G
      [110, 164.81, 220], // A
    ]
    const melody = [293.66, 369.99, 440, 369.99, 329.63, 293.66, 246.94, 293.66,
      369.99, 440, 493.88, 440, 369.99, 329.63, 293.66, 246.94]
    const play = () => {
      if (!this.ctx || this.scoreGain !== bus) return
      const now = ctx.currentTime + 0.02
      const beat = this.scoreBeat++
      const chord = chords[Math.floor(beat / 8) % chords.length]
      // Soft sustained strings / pads, changing every two measures.
      if (beat % 8 === 0) {
        for (const freq of chord) {
          const g = ctx.createGain()
          g.gain.setValueAtTime(0.0001, now)
          g.gain.linearRampToValueAtTime(0.095, now + 0.5)
          g.gain.exponentialRampToValueAtTime(0.0001, now + interval * 7.5)
          g.connect(bus)
          this.osc('triangle', freq, now, interval * 7.6, g)
        }
      }
      // Pizzicato pulse builds urgency at orders and on patrol.
      if (mode !== 'training' && mode !== 'explore') {
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, now)
        g.gain.linearRampToValueAtTime(mode === 'patrol' ? 0.16 : 0.09, now + 0.012)
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
        g.connect(bus)
        this.osc('triangle', chord[0] / 2, now, 0.25, g)
      }
      if (beat % 2 === 0) {
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, now)
        g.gain.linearRampToValueAtTime(mode === 'training' ? 0.07 : 0.14, now + 0.025)
        g.gain.exponentialRampToValueAtTime(0.0001, now + interval * 1.6)
        g.connect(bus)
        this.osc(mode === 'patrol' ? 'sawtooth' : 'sine', melody[Math.floor(beat / 2) % melody.length], now, interval * 1.7, g)
      }
    }
    play()
    this.scoreTimer = window.setInterval(play, interval * 1000)
  }

  stopScore(): void {
    if (this.scoreTimer !== null) window.clearInterval(this.scoreTimer)
    this.scoreTimer = null
    if (this.scoreGain && this.ctx) {
      const old = this.scoreGain
      old.gain.cancelScheduledValues(this.ctx.currentTime)
      old.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3)
    }
    this.scoreGain = null
    this.scoreMode = ''
  }

  /* ---------- one-shots ---------- */

  /** Slot-reel click. `speed` 0..1 (1 = fastest) raises pitch slightly. */
  tick(speed = 1): void {
    if (!this.ctx) return
    const at = this.ctx.currentTime
    const g = this.env(at, 0.05, 0.001, 0.045)
    if (!g) return
    this.osc('square', 1800 + speed * 900, at, 0.05, g)
  }

  /** Reel lands: thunk + rising triad. */
  lock(): void {
    if (!this.ctx) return
    const at = this.ctx.currentTime
    const thunk = this.env(at, 0.5, 0.004, 0.22)
    if (thunk) this.osc('sine', 72, at, 0.25, thunk)
    const click = this.env(at, 0.12, 0.001, 0.05)
    if (click) this.osc('triangle', 2400, at, 0.05, click)
    // triumphant little triad (A3 C#4 E4), staggered
    ;[220, 277.2, 329.6].forEach((f, i) => {
      const t = at + 0.12 + i * 0.09
      const g = this.env(t, 0.16, 0.012, 0.6)
      if (!g) return
      const lp = this.ctx!.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 2200
      lp.connect(g)
      this.osc('sawtooth', f, t, 0.7, lp)
    })
  }

  /** Two-tone ship's horn with a slow swell (~2 s). */
  horn(): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const at = ctx.currentTime
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(0.4, at + 0.35)
    g.gain.setValueAtTime(0.4, at + 1.3)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 2.1)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900
    g.connect(lp).connect(this.master)
    this.osc('sawtooth', 113, at, 2.2, g)
    this.osc('sawtooth', 92, at, 2.2, g)
    this.osc('sine', 56.5, at, 2.2, g)
  }

  /** Noise sweep for departures / scene changes. */
  whoosh(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const at = ctx.currentTime
    const buf = this.noiseBuffer()
    if (!buf) return
    const src = ctx.createBufferSource()
    src.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.1
    bp.frequency.setValueAtTime(260, at)
    bp.frequency.exponentialRampToValueAtTime(1400, at + 0.7)
    const g = this.env(at, 0.18, 0.08, 0.65)
    if (!g) return
    src.connect(bp).connect(g)
    src.start(at)
    src.stop(at + 0.9)
  }

  /** Port-arrival pluck (gentle major triad). */
  chime(): void {
    if (!this.ctx) return
    const at = this.ctx.currentTime
    ;[523.3, 659.3, 784].forEach((f, i) => {
      const t = at + i * 0.07
      const g = this.env(t, 0.12, 0.006, 0.9)
      if (g) this.osc('sine', f, t, 1.0, g)
    })
  }

  /** Homecoming: arpeggio + pad swell (~3 s). */
  fanfare(): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const at = ctx.currentTime
    ;[261.6, 329.6, 392, 523.3, 659.3].forEach((f, i) => {
      const t = at + i * 0.14
      const g = this.env(t, 0.14, 0.01, 1.2)
      if (!g) return
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 2600
      lp.connect(g)
      this.osc('sawtooth', f, t, 1.4, lp)
    })
    // pad underneath
    const pad = ctx.createGain()
    pad.gain.setValueAtTime(0.0001, at)
    pad.gain.exponentialRampToValueAtTime(0.1, at + 1.2)
    pad.gain.exponentialRampToValueAtTime(0.0001, at + 3.2)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 700
    pad.connect(lp)
    lp.connect(this.master)
    this.osc('triangle', 130.8, at, 3.4, pad)
    this.osc('triangle', 196, at, 3.4, pad)
  }
}

/** App-wide singleton. */
export const sound = new Sound()
