import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Narration, splitSentences } from './Narration'

describe('Narration', () => {
  it('splits scripts into sentences', () => {
    expect(splitSentences('One. Two! Three?')).toEqual(['One.', 'Two!', 'Three?'])
  })

  it('shows the transcript and keeps controls disabled until audio is enabled', () => {
    render(
      <Narration unitName="Test" script="Hello there. Second line." audioSrc={null} audioEnabled={false} onEnableAudio={() => {}} />,
    )
    expect(screen.getByTestId('transcript')).toHaveTextContent('Hello there. Second line.')
    expect(screen.getByTestId('narration-play')).toBeDisabled()
    expect(screen.getByTestId('enable-audio')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(/Temporary fallback/)
  })
})
