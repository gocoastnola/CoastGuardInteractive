/**
 * Original CoastGuard Interactive score and cues. All instruments are authored
 * oscillator/noise synthesis; no recordings, licensed tracks, or remote audio.
 * The live scheduler and OfflineAudioContext previews use these same builders.
 */
export type ScoreMode = 'training' | 'orders' | 'arrival' | 'patrol' | 'explore'
export type Cue = 'orders-rise' | 'reveal' | 'arrival' | 'horn' | 'departure' | 'homecoming'
export const SCORE_BPM: Record<ScoreMode, number> = { training: 124, orders: 132, arrival: 128, patrol: 132, explore: 116 }
export const ORDERS_RISE_SECONDS = 4.6

export interface VoiceGroup {
  bus: GainNode
  sources: Set<AudioScheduledSourceNode>
  onEmpty?: () => void
}

export function createMaster(ctx: BaseAudioContext): GainNode {
  const master = ctx.createGain()
  master.gain.value = 0.82
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -12
  compressor.knee.value = 14
  compressor.ratio.value = 4
  compressor.attack.value = 0.004
  compressor.release.value = 0.17
  // A bounded, gentle final transfer protects combined score + impact peaks.
  const limiter = ctx.createWaveShaper()
  limiter.curve = Float32Array.from({ length: 4096 }, (_, i) => Math.tanh((i / 4095 * 2 - 1) * 1.2) * 0.94)
  limiter.oversample = '2x'
  master.connect(compressor).connect(limiter).connect(ctx.destination)
  return master
}

export function createGroup(ctx: BaseAudioContext, output: AudioNode, level = 0.72): VoiceGroup {
  const bus = ctx.createGain()
  bus.gain.value = level
  bus.connect(output)
  return { bus, sources: new Set() }
}

function own(group: VoiceGroup, source: AudioScheduledSourceNode, at: number, duration: number, nodes: AudioNode[]) {
  group.sources.add(source)
  source.onended = () => {
    source.disconnect()
    nodes.forEach((node) => node.disconnect())
    group.sources.delete(source)
    if (!group.sources.size) group.onEmpty?.()
  }
  source.start(at)
  if (Number.isFinite(duration)) source.stop(at + duration)
}

/** Stop scheduled voices using the audio clock, including when JS timers are throttled. */
export function stopGroup(ctx: BaseAudioContext, group: VoiceGroup, fade = 0.14) {
  const at = ctx.currentTime
  const gain = group.bus.gain
  const value = Math.max(0.0001, gain.value)
  gain.cancelScheduledValues(at)
  gain.setValueAtTime(value, at)
  gain.linearRampToValueAtTime(0.0001, at + fade)
  for (const source of group.sources) {
    try { source.stop(at + fade + 0.015) } catch { /* Already-ended one-shot. */ }
  }
  if (!group.sources.size) group.onEmpty?.()
}

function envelope(ctx: BaseAudioContext, group: VoiceGroup, at: number, duration: number, peak: number, attack = 0.008) {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.linearRampToValueAtTime(peak, at + Math.min(attack, duration * 0.95))
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  gain.connect(group.bus)
  return gain
}

function tone(ctx: BaseAudioContext, group: VoiceGroup, at: number, duration: number, freq: number, peak: number,
  type: OscillatorType = 'triangle', cutoff = 1800, endFreq = freq, attack = 0.008) {
  const source = ctx.createOscillator()
  source.type = type
  source.frequency.setValueAtTime(freq, at)
  if (endFreq !== freq) source.frequency.exponentialRampToValueAtTime(endFreq, at + duration)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(cutoff, at)
  const gain = envelope(ctx, group, at, duration, peak, attack)
  source.connect(filter).connect(gain)
  own(group, source, at, duration + 0.015, [filter, gain])
}

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>()
function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const existing = noiseCache.get(ctx)
  if (existing) return existing
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const samples = buffer.getChannelData(0)
  let seed = 0x51c00de
  for (let i = 0; i < samples.length; i++) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
    samples[i] = (seed >>> 0) / 0xffffffff * 2 - 1
  }
  noiseCache.set(ctx, buffer)
  return buffer
}

function noise(ctx: BaseAudioContext, group: VoiceGroup, at: number, duration: number, peak: number,
  filterType: BiquadFilterType = 'highpass', frequency = 4000, endFrequency = frequency, attack = 0.004) {
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer(ctx)
  source.loop = duration > 1
  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.setValueAtTime(frequency, at)
  if (frequency !== endFrequency) filter.frequency.exponentialRampToValueAtTime(endFrequency, at + duration)
  filter.Q.value = 0.7
  const gain = envelope(ctx, group, at, duration, peak, attack)
  source.connect(filter).connect(gain)
  own(group, source, at, duration + 0.01, [filter, gain])
}

function kick(ctx: BaseAudioContext, group: VoiceGroup, at: number, strength = 1) {
  tone(ctx, group, at, 0.24, 135, 0.67 * strength, 'sine', 260, 47, 0.003)
  noise(ctx, group, at, 0.025, 0.035 * strength, 'lowpass', 1800)
}
function snare(ctx: BaseAudioContext, group: VoiceGroup, at: number, strength = 1) {
  noise(ctx, group, at, 0.16, 0.23 * strength, 'bandpass', 1900)
  tone(ctx, group, at, 0.11, 190, 0.10 * strength, 'triangle', 900, 140)
}

// An original eight-bar, minor-to-major adventure motif: Em / C / G / D.
const ROOTS = [82.4069, 65.4064, 97.9989, 73.4162] as const
const TRIADS = [[1, 1.189207, 1.498307], [1, 1.259921, 1.498307], [1, 1.259921, 1.498307], [1, 1.259921, 1.498307]] as const
const LEAD = [0, 7, 10, 12, 7, 3, 5, 7, 12, 15, 14, 10, 7, 5, 3, 7] as const

/** Schedule one eighth note. Short attacks, percussion and bass replace the old pad/pluck bed. */
export function scheduleScoreStep(ctx: BaseAudioContext, group: VoiceGroup, mode: ScoreMode, step: number, at: number) {
  const eighth = 30 / SCORE_BPM[mode]
  const bar = Math.floor(step / 8)
  const slot = step % 8
  const chordIndex = Math.floor(bar / 2) % ROOTS.length
  const root = ROOTS[chordIndex]
  const energy = mode === 'patrol' ? 1 : mode === 'orders' ? 0.82 : mode === 'arrival' ? 0.88 : mode === 'training' ? 0.76 : 0.46
  const build = bar % 4 === 3 ? 1.08 : 1
  if (slot === 0 || slot === 4 || (mode === 'patrol' && slot === 7)) kick(ctx, group, at, energy * build)
  if (slot === 2 || slot === 6) snare(ctx, group, at, energy * 0.80)
  // Alternating hats give forward momentum without loud digital clicks.
  if (mode !== 'explore' || slot % 2 === 0) noise(ctx, group, at, slot % 2 ? 0.035 : 0.055, energy * (slot % 2 ? 0.027 : 0.045), 'highpass', 6200)
  const bassRatio = slot === 3 || slot === 7 ? 1.498307 : slot === 5 ? 2 : 1
  tone(ctx, group, at, eighth * 0.78, root * bassRatio, energy * 0.19, 'triangle', 520)
  if (slot === 0 || slot === 3 || slot === 6) {
    for (const ratio of TRIADS[chordIndex]) {
      tone(ctx, group, at, eighth * 1.35, root * ratio * 2, energy * 0.045, 'sawtooth', 1600, root * ratio * 2, 0.013)
    }
  }
  // A coherent two-bar lead, with breathing room on alternate eighth notes.
  if (slot % 2 === 0 && mode !== 'orders') {
    const degree = LEAD[Math.floor(step / 2) % LEAD.length]
    const freq = 329.6276 * 2 ** (degree / 12)
    tone(ctx, group, at, eighth * 1.45, freq, energy * 0.065, 'sawtooth', mode === 'patrol' ? 2300 : 1650, freq, 0.015)
    tone(ctx, group, at + 0.009, eighth * 1.35, freq / 2, energy * 0.025, 'triangle', 1300)
  }
  if (bar % 4 === 3 && slot === 7 && mode !== 'explore') {
    snare(ctx, group, at + eighth * 0.50, energy * 0.45)
    snare(ctx, group, at + eighth * 0.75, energy * 0.30)
  }
}

export function scheduleCue(ctx: BaseAudioContext, group: VoiceGroup, cue: Cue, at: number) {
  if (cue === 'orders-rise') {
    // One authored roll and riser, independent of how many visual rows pass.
    for (let i = 0; i < 25; i++) {
      const progress = i / 25
      const t = at + 4.38 * (1 - (1 - progress) ** 1.6)
      const strength = 0.20 + progress * 0.55
      tone(ctx, group, t, 0.12, 125 + progress * 90, 0.08 * strength, 'triangle', 1100, 85 + progress * 50)
      noise(ctx, group, t, 0.075, 0.07 * strength, 'bandpass', 1300 + progress * 800)
    }
    noise(ctx, group, at, ORDERS_RISE_SECONDS, 0.16, 'bandpass', 260, 4200, 4.10)
    tone(ctx, group, at, 4.55, 55, 0.065, 'sawtooth', 1800, 220, 3.95)
    tone(ctx, group, at, 4.55, 82.4069, 0.045, 'triangle', 2100, 329.6276, 3.95)
  } else if (cue === 'reveal') {
    kick(ctx, group, at, 1.20)
    noise(ctx, group, at, 0.7, 0.13, 'lowpass', 1900)
    for (const freq of [146.8324, 184.9972, 220, 293.6648]) tone(ctx, group, at + 0.07, 1.45, freq, 0.11, 'sawtooth', 1800, freq, 0.09)
  } else if (cue === 'arrival') {
    // Low, nautical body and a broad harmonic arrival—not the old high pluck.
    tone(ctx, group, at, 0.32, 125, 0.48, 'sine', 300, 54, 0.005)
    for (const freq of [146.8324, 220, 293.6648]) tone(ctx, group, at + 0.09, 1.10, freq, 0.072, 'sawtooth', 1300, freq, 0.09)
    noise(ctx, group, at + 0.025, 0.62, 0.045, 'bandpass', 900, 2300, 0.12)
  } else if (cue === 'horn') {
    for (const [freq, peak] of [[97.9989, 0.11], [130.8128, 0.10], [195.9977, 0.035]]) {
      tone(ctx, group, at, 2.0, freq, peak, 'sawtooth', 750, freq, 0.26)
    }
  } else if (cue === 'departure') {
    noise(ctx, group, at, 0.7, 0.085, 'bandpass', 320, 1700, 0.16)
  } else {
    kick(ctx, group, at, 0.95)
    noise(ctx, group, at, 1.9, 0.075, 'highpass', 3200, 7000, 0.07)
    for (const [i, freq] of [329.6276, 391.9954, 493.8833, 587.3295, 659.2551, 783.9909].entries()) {
      tone(ctx, group, at + i * 0.16, 1.25, freq, 0.10, 'sawtooth', 2100, freq, 0.045)
    }
    for (const freq of [130.8128, 164.8138, 195.9977]) tone(ctx, group, at + 0.8, 1.6, freq, 0.07, 'triangle', 1400, freq, 0.13)
  }
}

/** Only low non-tonal sea air; the former two-oscillator spa-like drone is gone. */
export function scheduleSeaAir(ctx: BaseAudioContext, group: VoiceGroup) {
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer(ctx)
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 430
  filter.Q.value = 0.5
  source.connect(filter).connect(group.bus)
  own(group, source, ctx.currentTime, Infinity, [filter])
}

/** Reproducible previews use exactly the live score/cue graph, without real-time playback. */
export async function renderAudioPreview(options: { mode?: ScoreMode; cue?: Cue; duration: number; withReveal?: boolean }): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil(options.duration * 44100), 44100)
  const master = createMaster(ctx)
  if (options.mode) {
    const group = createGroup(ctx, master, 0.72)
    const eighth = 30 / SCORE_BPM[options.mode]
    for (let step = 0; step * eighth + 0.05 < options.duration - 0.3; step++) scheduleScoreStep(ctx, group, options.mode, step, step * eighth + 0.05)
  }
  if (options.cue) {
    const group = createGroup(ctx, master, 0.72)
    scheduleCue(ctx, group, options.cue, 0.05)
    if (options.withReveal) scheduleCue(ctx, group, 'reveal', ORDERS_RISE_SECONDS + 0.05)
  }
  return ctx.startRendering()
}
