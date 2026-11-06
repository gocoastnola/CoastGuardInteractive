import { useState } from 'react'
import { sound } from '../../lib/audio'

/** Quiet mute chip shown during cinematic scenes. */
export function SoundToggle() {
  const [muted, setMuted] = useState(sound.muted)
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      aria-pressed={muted}
      onClick={() => {
        sound.enable()
        const next = sound.toggleMuted()
        setMuted(next)
        if (!next) {
          sound.ambient()
          sound.chime()
        }
      }}
      data-testid="sound-toggle"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
