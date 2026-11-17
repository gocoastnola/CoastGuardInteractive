import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Sound } from './audio'
import { ORDERS_RISE_SECONDS, SCORE_BPM } from './audioScore'
import { RECORDED_SCORE_CUE_SECONDS } from './recordedScore'

function param(value = 0) {
  return { value, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() }
}
class Node {
  gain = param(1)
  frequency = param()
  Q = param()
  threshold = param()
  knee = param()
  ratio = param()
  attack = param()
  release = param()
  onended: (() => void) | null = null
  connect = vi.fn((next: Node) => next)
  disconnect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}
class FakeContext {
  static withMedia = false
  createMediaElementSource?: ReturnType<typeof vi.fn>
  static instances: FakeContext[] = []
  currentTime = 10
  state = 'running'
  sampleRate = 44100
  destination = new Node()
  sources: Node[] = []
  resume = vi.fn(async () => { this.state = 'running' })
  constructor() {
    FakeContext.instances.push(this)
    if (FakeContext.withMedia) this.createMediaElementSource = vi.fn(() => new Node())
  }
  createGain() { return new Node() }
  createDynamicsCompressor() { return new Node() }
  createWaveShaper() { return new Node() }
  createBiquadFilter() { return new Node() }
  createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) } }
  createOscillator() { const source = new Node(); this.sources.push(source); return source }
  createBufferSource() { const source = new Node(); this.sources.push(source); return source }
}

beforeEach(() => {
  vi.useFakeTimers()
  FakeContext.instances = []
  FakeContext.withMedia = false
  vi.stubGlobal('AudioContext', FakeContext)
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('authored adventure audio lifecycle', () => {
  it('stays silent until enabled and reuses the one gesture-unlocked context', async () => {
    const sound = new Sound()
    sound.score('patrol'); sound.slotSpin(); sound.chime(); sound.ambient()
    expect(FakeContext.instances).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
    sound.enable(); sound.enable()
    expect(FakeContext.instances).toHaveLength(1)
    expect(sound.enabled).toBe(true)
    const ctx = FakeContext.instances[0]
    ctx.state = 'suspended'
    sound.enable()
    expect(ctx.resume).toHaveBeenCalledOnce()
    expect(FakeContext.instances).toHaveLength(1)
  })

  it('runs one scheduler per phase and stops prior phase voices instead of stacking loops', () => {
    const sound = new Sound(); sound.enable(); sound.score('training')
    const ctx = FakeContext.instances[0]
    const firstVoices = [...ctx.sources]
    expect(firstVoices.length).toBeGreaterThan(0)
    expect(vi.getTimerCount()).toBe(1)
    sound.score('training')
    expect(ctx.sources).toHaveLength(firstVoices.length)
    sound.score('patrol')
    expect(vi.getTimerCount()).toBe(1)
    firstVoices.forEach((source) => expect(source.stop).toHaveBeenCalledTimes(2))
    sound.stopScore()
    expect(vi.getTimerCount()).toBe(0)
    ctx.sources.forEach((source) => expect(source.stop).toHaveBeenCalledTimes(2))
  })

  it('resumes from the current audio clock without scheduling an interrupted-tab backlog', () => {
    const sound = new Sound(); sound.enable(); sound.score('patrol')
    const ctx = FakeContext.instances[0]
    const priorCount = ctx.sources.length
    ctx.currentTime = 400
    vi.advanceTimersByTime(30)
    const resumedVoices = ctx.sources.slice(priorCount)
    expect(resumedVoices.length).toBeGreaterThan(0)
    expect(resumedVoices.length).toBeLessThan(20)
    resumedVoices.forEach((source) => expect(source.start.mock.calls[0][0]).toBeGreaterThanOrEqual(400))
    sound.stopScore()
  })

  it('cancels the cohesive riser on reveal and leaves no interval or row-click stream', () => {
    const sound = new Sound(); sound.enable(); sound.slotSpin()
    const ctx = FakeContext.instances[0]
    const riseVoices = [...ctx.sources]
    expect(riseVoices.length).toBeGreaterThan(20)
    const beforeTick = ctx.sources.length
    for (let i = 0; i < 100; i++) sound.tick(i / 100)
    expect(ctx.sources).toHaveLength(beforeTick)
    sound.lock()
    riseVoices.forEach((source) => expect(source.stop).toHaveBeenCalledTimes(2))
    expect(ctx.sources.length).toBeGreaterThan(riseVoices.length)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps the rhythmic score and fixed visual reel timing explicit', () => {
    expect(SCORE_BPM.training).toBe(124)
    expect(SCORE_BPM.orders).toBe(132)
    expect(SCORE_BPM.patrol).toBe(132)
    expect(ORDERS_RISE_SECONDS).toBe(4.6)
  })
})


class FakeMedia extends EventTarget {
  static instances: FakeMedia[] = []
  static rejectPlay = false
  src = ''; preload = ''; loop = false; private time = 0; paused = true; readyState = 0; seeking = false
  get currentTime() { return this.time }
  set currentTime(value: number) { this.time = value; queueMicrotask(() => this.dispatchEvent(new Event('seeked'))) }
  load = vi.fn()
  pause = vi.fn(() => { this.paused = true; this.dispatchEvent(new Event('pause')) })
  play = vi.fn(() => {
    if (FakeMedia.rejectPlay) return Promise.reject(new DOMException('Fixture autoplay rejection', 'NotAllowedError'))
    this.paused = false; this.readyState = 4
    return Promise.resolve().then(() => { this.dispatchEvent(new Event('loadedmetadata')); this.dispatchEvent(new Event('playing')) }).then(() => {})
  })
  constructor() { super(); FakeMedia.instances.push(this) }
}
const settleMedia = async () => { vi.runAllTicks(); await Promise.resolve(); await Promise.resolve(); vi.runAllTicks(); await Promise.resolve(); await Promise.resolve(); vi.runAllTicks() }

describe('streaming recorded score with authored fallback', () => {
  beforeEach(() => {
    FakeContext.withMedia = true
    FakeMedia.instances = []; FakeMedia.rejectPlay = false
    vi.stubGlobal('Audio', FakeMedia)
  })

  it('primes play in the gesture call and reuses one player/node without restarting on scene changes', async () => {
    const sound = new Sound()
    sound.enable()
    const media = FakeMedia.instances[0]
    expect(media.play).toHaveBeenCalledOnce()
    expect(media.src).toBe('/media/music/vanguard-scott-buckley.mp3')
    expect(media.preload).toBe('none')
    expect(media.loop).toBe(false)
    expect(sound.musicState.cue).toBe(45)
    sound.score('training')
    await settleMedia()
    expect(sound.musicState.recordedPlaying).toBe(true)
    expect(sound.musicState.fallbackAudible).toBe(false)
    expect(media.currentTime).toBe(RECORDED_SCORE_CUE_SECONDS)
    media.currentTime = 72
    sound.score('patrol'); sound.enable()
    expect(media.currentTime).toBe(72)
    expect(media.play).toHaveBeenCalledOnce()
    expect(FakeMedia.instances).toHaveLength(1)
    expect(FakeContext.instances).toHaveLength(1)
    expect(FakeContext.instances[0].createMediaElementSource).toHaveBeenCalledOnce()
    sound.stopScore()
  })

  it('keeps the rhythmic fallback active if browser play is rejected', async () => {
    FakeMedia.rejectPlay = true
    const sound = new Sound(); sound.enable(); sound.score('patrol')
    await settleMedia()
    expect(sound.musicState.recordedPlaying).toBe(false)
    expect(sound.musicState.fallbackAudible).toBe(true)
    expect(FakeContext.instances[0].sources.length).toBeGreaterThan(0)
    expect(vi.getTimerCount()).toBe(1)
    sound.stopScore()
  })

  it('restores fallback on buffering, resumes the recording, and resets transport on restart', async () => {
    const sound = new Sound(); sound.enable(); sound.score('arrival')
    await settleMedia()
    const media = FakeMedia.instances[0]
    media.readyState = 1; media.dispatchEvent(new Event('waiting'))
    expect(sound.musicState.fallbackAudible).toBe(true)
    media.readyState = 4; media.dispatchEvent(new Event('playing'))
    expect(sound.musicState.recordedPlaying).toBe(true)
    expect(sound.musicState.fallbackAudible).toBe(false)
    media.currentTime = 30
    sound.stopScore()
    expect(media.paused).toBe(true)
    expect(media.currentTime).toBe(RECORDED_SCORE_CUE_SECONDS)
    expect(sound.musicState.mode).toBe('')
    sound.enable(); sound.score('patrol')
    await settleMedia()
    expect(FakeMedia.instances).toHaveLength(1)
    expect(FakeContext.instances[0].createMediaElementSource).toHaveBeenCalledOnce()
    expect(sound.musicState.recordedPlaying).toBe(true)
    sound.stopScore()
  })

  it('loops the same streaming element at the energetic cue rather than the quiet introduction', async () => {
    const sound = new Sound(); sound.enable(); sound.score('patrol')
    await settleMedia()
    const media = FakeMedia.instances[0]
    media.currentTime = 234; media.paused = true
    media.dispatchEvent(new Event('ended'))
    await settleMedia()
    expect(media.currentTime).toBe(RECORDED_SCORE_CUE_SECONDS)
    expect(media.play).toHaveBeenCalledTimes(2)
    expect(FakeMedia.instances).toHaveLength(1)
    expect(FakeContext.instances[0].createMediaElementSource).toHaveBeenCalledOnce()
    expect(sound.musicState.recordedPlaying).toBe(true)
    sound.stopScore()
  })

})
