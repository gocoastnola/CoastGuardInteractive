import { publicAsset } from './assets'

export const RECORDED_SCORE_URL = '/media/music/vanguard-scott-buckley.mp3'
export const RECORDED_SCORE_LEVEL = 0.4
// The opening 45 seconds are substantially quieter; use the energetic excerpt.
export const RECORDED_SCORE_CUE_SECONDS = 45

/**
 * A single streaming player feeds the existing WebAudio mix. It never decodes
 * the complete recording into an AudioBuffer. Playback is primed synchronously
 * from enable()'s user gesture, but is inaudible until the cue has settled and
 * the journey is active. Scene changes preserve the recording's position.
 */
export class RecordedScore {
  private readonly element: HTMLAudioElement
  private readonly bus: GainNode
  private pendingPlay: Promise<void> | null = null
  private active = false
  private playing = false
  private mediaPlaying = false
  private failed = false
  private needsCue = true
  private cueReady = false

  constructor(
    private readonly ctx: AudioContext,
    output: AudioNode,
    private readonly onPlaybackChange: (playing: boolean) => void,
    makeElement: () => HTMLAudioElement = () => new Audio(),
  ) {
    this.element = makeElement()
    this.element.preload = 'none'
    // Native looping returns to the quiet introduction. Reuse this player at
    // the chosen excerpt instead; failed loop-play falls back to the score.
    this.element.loop = false
    this.element.src = publicAsset(RECORDED_SCORE_URL)
    this.bus = ctx.createGain()
    this.bus.gain.value = 0
    ctx.createMediaElementSource(this.element).connect(this.bus).connect(output)
    this.element.addEventListener('loadedmetadata', () => this.prepareCue())
    this.element.addEventListener('seeking', () => {
      this.mediaPlaying = false
      this.setPlaying(false)
    })
    this.element.addEventListener('seeked', () => {
      this.cueReady = this.element.currentTime >= RECORDED_SCORE_CUE_SECONDS - 0.1
      this.needsCue = !this.cueReady
      if (this.active && this.mediaPlaying && this.cueReady) this.setPlaying(true)
    })
    this.element.addEventListener('playing', () => {
      this.mediaPlaying = true
      this.prepareCue()
      if (this.active && this.cueReady) this.setPlaying(true)
    })
    for (const event of ['waiting', 'stalled', 'pause', 'error']) {
      this.element.addEventListener(event, () => {
        if (event === 'error') this.failed = true
        this.mediaPlaying = false
        this.setPlaying(false)
      })
    }
    this.element.addEventListener('ended', () => {
      this.mediaPlaying = false
      this.needsCue = true
      this.cueReady = false
      this.setPlaying(false)
      if (this.active) { this.prepareCue(); this.requestPlay() }
    })
  }

  get isPlaying(): boolean { return this.playing && this.active && !this.element.paused }

  /** Called inside the existing synchronous click/keydown audio unlock. */
  primeFromGesture(): void {
    if (this.failed) {
      this.failed = false; this.needsCue = true; this.cueReady = false
      this.element.load()
    }
    this.prepareCue()
    this.requestPlay()
  }

  setActive(active: boolean): void {
    this.active = active
    if (!active) {
      this.element.pause()
      this.needsCue = true
      this.cueReady = false
      this.prepareCue()
      this.setPlaying(false)
      return
    }
    this.prepareCue()
    if (this.mediaPlaying && this.cueReady && !this.element.paused) {
      this.setPlaying(true)
      return
    }
    if (!this.failed) this.requestPlay()
  }

  private prepareCue(): void {
    if (!this.needsCue) return
    if (this.element.readyState < 1) {
      // Safari may defer this assignment until metadata; retry on loadedmetadata.
      try { this.element.currentTime = RECORDED_SCORE_CUE_SECONDS } catch { /* Metadata not yet available. */ }
      return
    }
    if (Math.abs(this.element.currentTime - RECORDED_SCORE_CUE_SECONDS) < 0.05 && !this.element.seeking) {
      this.cueReady = true
      this.needsCue = false
      return
    }
    try {
      this.element.currentTime = RECORDED_SCORE_CUE_SECONDS
      this.needsCue = false
    } catch {
      // The rhythmic fallback remains audible until a valid cue can be played.
      this.cueReady = false
    }
  }

  private requestPlay(): void {
    if (this.pendingPlay || !this.element.paused) return
    try {
      this.pendingPlay = Promise.resolve(this.element.play())
        .catch(() => { this.mediaPlaying = false; this.setPlaying(false) })
        .finally(() => { this.pendingPlay = null })
    } catch {
      this.mediaPlaying = false
      this.setPlaying(false)
    }
  }

  private setPlaying(playing: boolean): void {
    const next = playing && this.active && this.cueReady
    const at = this.ctx.currentTime
    const gain = this.bus.gain
    gain.cancelScheduledValues(at)
    gain.setValueAtTime(Math.max(0.0001, gain.value), at)
    gain.linearRampToValueAtTime(next ? RECORDED_SCORE_LEVEL : 0, at + (next ? 0.55 : 0.2))
    if (this.playing === next) return
    this.playing = next
    this.onPlaybackChange(next)
  }
}
