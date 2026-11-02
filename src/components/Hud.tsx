import { JUMP_LABELS, JUMP_ORDER, type JumpTarget } from '../lib/camera'
import { LABELS } from '../journey/copy'
import { IconAnchor, IconList, IconMute, IconReplay, IconVolume } from './Icons'

interface Props {
  directoryOpen: boolean
  audioEnabled: boolean
  activeJump: JumpTarget | null
  onToggleDirectory: () => void
  onToggleAudio: () => void
  onJump: (t: JumpTarget) => void
  onRestart: () => void
}

/** Top bar + bottom region chips. Everything here sits above the map but below the panel. */
export function Hud({ directoryOpen, audioEnabled, activeJump, onToggleDirectory, onToggleAudio, onJump, onRestart }: Props) {
  return (
    <>
      <div className="hud">
        <div className="hud-brand">
          <IconAnchor />
          <span className="hud-brand-text">CoastGuard Interactive</span> <small>DEMO</small>
        </div>
        <div className="hud-actions">
          <button className="chip" onClick={onRestart} data-testid="restart-adventure" aria-label={LABELS.restart} title={LABELS.restart}>
            <IconReplay /> <span className="chip-text">{LABELS.restart}</span>
          </button>
          <button
            className="chip"
            aria-pressed={audioEnabled}
            onClick={onToggleAudio}
            aria-label={audioEnabled ? 'Audio on — click to turn off' : 'Audio off — click to enable'}
            data-testid="audio-toggle"
          >
            {audioEnabled ? <IconVolume /> : <IconMute />}
            <span className="chip-text">{audioEnabled ? 'Audio on' : 'Audio off'}</span>
          </button>
          <button
            className="chip"
            aria-pressed={directoryOpen}
            onClick={onToggleDirectory}
            aria-label="Directory"
            data-testid="directory-toggle"
          >
            <IconList /> <span className="chip-text">Directory</span>
          </button>
        </div>
      </div>

      <nav className="region-chips" aria-label="Quick jump">
        {JUMP_ORDER.map((t) => (
          <button
            key={t}
            className={`chip ${activeJump === t ? 'is-active' : ''}`}
            onClick={() => onJump(t)}
            data-testid={`jump-${t}`}
          >
            {JUMP_LABELS[t]}
          </button>
        ))}
      </nav>
    </>
  )
}
