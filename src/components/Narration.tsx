import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IconMute, IconPause, IconPlay, IconReplay, IconVolume } from './Icons'

interface Props {
  unitName: string
  script: string
  /** Pre-rendered narration audio URL (Phase 3+). Null → browser TTS fallback. */
  audioSrc: string | null
  audioEnabled: boolean
  onEnableAudio: () => void
}

type Status = 'idle' | 'playing' | 'paused' | 'ended' | 'unsupported'

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Narration player. TEMPORARY FALLBACK: uses the browser's speechSynthesis API
 * to read `script` aloud. Never autoplays — requires the global audio switch
 * AND an explicit Play press. Captions highlight the sentence being spoken.
 */
export function Narration({ unitName, script, audioSrc, audioEnabled, onEnableAudio }: Props) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const sentences = useMemo(() => splitSentences(script), [script])
  const offsets = useMemo(() => {
    let acc = 0
    return sentences.map((s) => {
      const start = acc
      acc += s.length + 1
      return start
    })
  }, [sentences])

  const [status, setStatus] = useState<Status>(supported ? 'idle' : 'unsupported')
  const [current, setCurrent] = useState(-1)
  const [volume, setVolume] = useState(0.9)
  const [muted, setMuted] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const cancel = useCallback(() => {
    if (!supported) return
    utterRef.current = null
    window.speechSynthesis.cancel()
  }, [supported])

  /* stop speaking when the unit changes / component unmounts */
  useEffect(() => {
    setStatus(supported ? 'idle' : 'unsupported')
    setCurrent(-1)
    return () => cancel()
  }, [script, supported, cancel])

  /** Speak sentences[from..] with explicit volume settings (utterance volume is fixed at speak()). */
  const speakFrom = useCallback(
    (from: number, m: boolean, v: number) => {
      if (!supported) return
      cancel()
      const text = sentences.slice(from).join(' ')
      if (!text) return
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = 0.98
      u.pitch = 1
      u.volume = m ? 0 : v
      const localOffsets = offsets.slice(from).map((o) => o - offsets[from])
      u.onboundary = (ev) => {
        let idx = 0
        for (let i = 0; i < localOffsets.length; i++) if (ev.charIndex >= localOffsets[i]) idx = i
        setCurrent(from + idx)
      }
      u.onstart = () => {
        setStatus('playing')
        setCurrent(from)
      }
      u.onend = () => {
        if (utterRef.current === u) {
          setStatus('ended')
          setCurrent(-1)
        }
      }
      u.onerror = (ev) => {
        if (ev.error === 'interrupted' || ev.error === 'canceled') return
        setStatus('idle')
      }
      utterRef.current = u
      window.speechSynthesis.speak(u)
    },
    [supported, cancel, sentences, offsets],
  )

  const play = () => {
    if (!audioEnabled) return
    if (status === 'paused') {
      window.speechSynthesis.resume()
      setStatus('playing')
      return
    }
    speakFrom(0, muted, volume)
  }
  const pause = () => {
    if (status !== 'playing') return
    window.speechSynthesis.pause()
    setStatus('paused')
  }
  const replay = () => {
    if (!audioEnabled) return
    speakFrom(0, muted, volume)
  }
  const restartIfActive = (m: boolean, v: number) => {
    if (status === 'playing' || status === 'paused') speakFrom(Math.max(0, current), m, v)
  }
  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    restartIfActive(next, volume)
  }
  const onVolume = (v: number) => {
    setVolume(v)
    if (muted && v > 0) setMuted(false)
  }
  const onVolumeCommit = () => restartIfActive(muted, volume)

  const isPlaying = status === 'playing'
  const controlsDisabled = !audioEnabled || !supported

  return (
    <div data-testid="narration">
      <h3>Narration</h3>
      <div className="notice" role="note">
        <span aria-hidden="true">🔈</span>
        <span>
          {audioSrc
            ? 'Pre-rendered narration audio.'
            : 'Temporary fallback: your browser’s built-in text-to-speech reads the demo script. Studio narration audio is planned for a later phase.'}
        </span>
      </div>

      {!audioEnabled && (
        <div className="narration-controls">
          <button className="btn btn-ghost" onClick={onEnableAudio} data-testid="enable-audio">
            <IconVolume /> Enable audio to play narration
          </button>
        </div>
      )}

      <div className="narration-controls" aria-label={`Narration controls for ${unitName}`}>
        <button
          className={`icon-btn ${isPlaying ? '' : 'is-primary'}`}
          onClick={isPlaying ? pause : play}
          disabled={controlsDisabled}
          aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
          data-testid="narration-play"
        >
          {isPlaying ? <IconPause /> : <IconPlay />}
        </button>
        <button className="icon-btn" onClick={replay} disabled={controlsDisabled} aria-label="Replay narration">
          <IconReplay />
        </button>
        <button
          className="icon-btn"
          onClick={toggleMute}
          disabled={controlsDisabled}
          aria-pressed={muted}
          aria-label={muted ? 'Unmute narration' : 'Mute narration'}
        >
          {muted ? <IconMute /> : <IconVolume />}
        </button>
        <label className="volume">
          <span className="sr-only">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            disabled={controlsDisabled}
            onChange={(e) => onVolume(Number(e.target.value))}
            onMouseUp={onVolumeCommit}
            onTouchEnd={onVolumeCommit}
            onKeyUp={onVolumeCommit}
          />
        </label>
      </div>

      <div className="transcript" data-testid="transcript">
        {sentences.map((s, i) => (
          <span key={i} className={i === current ? 'is-current' : undefined}>
            {s}{' '}
          </span>
        ))}
      </div>
      <p className="narration-status" aria-live="polite">
        {status === 'unsupported' && 'Speech synthesis is not available in this browser — transcript shown above.'}
        {status === 'idle' && supported && (audioEnabled ? 'Ready. Press play to hear the demo narration.' : 'Audio is off.')}
        {status === 'playing' && 'Playing (browser text-to-speech)…'}
        {status === 'paused' && 'Paused.'}
        {status === 'ended' && 'Finished. Replay to listen again.'}
      </p>
    </div>
  )
}
