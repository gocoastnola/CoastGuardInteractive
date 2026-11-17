/**
 * A licensed, bundled recorded score plus original WebAudio cues and a rhythmic
 * fallback. Audio remains gesture-unlocked with one shared context;
 * the owner's existing no-mute cinematic policy is unchanged.
 */
import {
  createGroup, createMaster, scheduleCue, scheduleScoreStep, scheduleSeaAir, stopGroup,
  SCORE_BPM, type Cue, type ScoreMode, type VoiceGroup,
} from './audioScore'
import { RecordedScore, RECORDED_SCORE_CUE_SECONDS } from './recordedScore'

export class Sound {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientGroup: VoiceGroup | null = null
  private scoreGroup: VoiceGroup | null = null
  private spinGroup: VoiceGroup | null = null
  private scoreTimer: number | null = null
  private scoreMode: ScoreMode | '' = ''
  private scoreStep = 0
  private nextScoreAt = 0
  private oneShots = new Set<VoiceGroup>()
  private recentCueTimes = new Map<Cue, number>()
  private recording: RecordedScore | null = null
  private recordedPlaying = false

  get enabled(): boolean { return !!this.ctx }
  /** Read-only transport diagnostics; no UI, telemetry, or tracking. */
  get musicState() {
    return { mode: this.scoreMode, cue: RECORDED_SCORE_CUE_SECONDS, recordedPlaying: this.recordedPlaying,
      fallbackAudible: !!this.scoreMode && !this.recordedPlaying,
      fallbackBpm: this.scoreMode ? SCORE_BPM[this.scoreMode] : null }
  }

  /** Call synchronously from the existing click/keydown handler. Idempotent. */
  enable(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {})
      this.recording?.primeFromGesture()
      return
    }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      this.ctx = new Ctx()
      this.master = createMaster(this.ctx)
      if (typeof this.ctx.createMediaElementSource === 'function') {
        try {
          this.recording = new RecordedScore(this.ctx, this.master, (playing) => {
            this.recordedPlaying = playing
            this.setFallbackLevel()
          })
          // This play() call stays inside the initiating user gesture, before ZIP lookup.
          this.recording.primeFromGesture()
        } catch { this.recording = null }
      }
    } catch {
      this.ctx = null
      this.master = null
    }
  }

  ambient(): void {
    if (!this.ctx || !this.master || this.ambientGroup) return
    const group = createGroup(this.ctx, this.master, 0.018)
    group.onEmpty = () => group.bus.disconnect()
    scheduleSeaAir(this.ctx, group)
    this.ambientGroup = group
  }

  stopAmbient(): void {
    if (this.ctx && this.ambientGroup) stopGroup(this.ctx, this.ambientGroup, 0.4)
    this.ambientGroup = null
  }

  score(mode: ScoreMode | 'off'): void {
    if (mode === this.scoreMode) return
    this.stopFallbackScore()
    if (mode === 'off' || !this.ctx || !this.master) { this.recording?.setActive(false); return }
    const ctx = this.ctx
    this.recording?.setActive(true)
    const group = createGroup(ctx, this.master, 0.72)
    group.bus.gain.setValueAtTime(0.0001, ctx.currentTime)
    group.bus.gain.linearRampToValueAtTime(this.recordedPlaying ? 0.0001 : 0.72, ctx.currentTime + 0.32)
    this.scoreGroup = group
    this.scoreMode = mode
    this.scoreStep = 0
    this.nextScoreAt = ctx.currentTime + 0.04
    const schedule = () => {
      if (this.scoreGroup !== group || !this.ctx) return
      // Resume at the current audio clock after interruptions; never catch up a backlog.
      if (this.nextScoreAt < ctx.currentTime - 0.2) this.nextScoreAt = ctx.currentTime + 0.025
      const horizon = ctx.currentTime + 0.12
      while (this.nextScoreAt < horizon) {
        scheduleScoreStep(ctx, group, mode, this.scoreStep++, this.nextScoreAt)
        this.nextScoreAt += 30 / SCORE_BPM[mode]
      }
    }
    schedule()
    this.scoreTimer = window.setInterval(schedule, 30)
  }

  private setFallbackLevel(): void {
    if (!this.ctx || !this.scoreGroup) return
    const gain = this.scoreGroup.bus.gain
    const at = this.ctx.currentTime
    gain.cancelScheduledValues(at)
    gain.setValueAtTime(Math.max(0.0001, gain.value), at)
    gain.linearRampToValueAtTime(this.recordedPlaying ? 0.0001 : 0.72, at + 0.4)
  }

  stopScore(): void {
    this.stopFallbackScore()
    this.recording?.setActive(false)
  }

  private stopFallbackScore(): void {
    if (this.scoreTimer !== null) window.clearInterval(this.scoreTimer)
    this.scoreTimer = null
    if (this.ctx && this.scoreGroup) {
      const group = this.scoreGroup
      group.onEmpty = () => group.bus.disconnect()
      stopGroup(this.ctx, group, 0.18)
    }
    this.scoreGroup = null
    this.scoreMode = ''
  }

  private play(cue: Cue): VoiceGroup | null {
    if (!this.ctx || !this.master) return null
    const at = this.ctx.currentTime
    // React's development effect replay must not double entry cues.
    if (at - (this.recentCueTimes.get(cue) ?? -Infinity) < 0.08) return null
    this.recentCueTimes.set(cue, at)
    const group = createGroup(this.ctx, this.master, 0.72)
    this.oneShots.add(group)
    group.onEmpty = () => { group.bus.disconnect(); this.oneShots.delete(group) }
    scheduleCue(this.ctx, group, cue, at + 0.015)
    return group
  }

  /** One coherent 4.6-second anticipation roll/riser, never one sound per visual row. */
  slotSpin(): void {
    this.stopSlotSpin()
    this.spinGroup = this.play('orders-rise')
  }

  stopSlotSpin(): void {
    if (this.ctx && this.spinGroup) stopGroup(this.ctx, this.spinGroup, 0.07)
    this.spinGroup = null
  }

  /** Compatibility method; row ticks no longer contribute to the soundtrack. */
  tick(_speed = 1): void {}

  lock(): void { this.stopSlotSpin(); this.play('reveal') }
  horn(): void { this.play('horn') }
  whoosh(): void { this.play('departure') }
  /** Existing scene API now plays a full-bodied nautical arrival instead of a plucked boop. */
  chime(): void { this.play('arrival') }
  fanfare(): void { this.play('homecoming') }
}

export const sound = new Sound()
