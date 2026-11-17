import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SafeImage } from './SafeImage'
import { publicAsset } from '../lib/assets'

describe('public assets and unavailable photography', () => {
  it('resolves bundled assets at root and project subpaths without changing external sources', () => {
    expect(publicAsset('/media/mission-ice.jpg', '/')).toBe('/media/mission-ice.jpg')
    expect(publicAsset('/media/mission-ice.jpg', '/CoastGuardInteractive/')).toBe('/CoastGuardInteractive/media/mission-ice.jpg')
    expect(publicAsset('/CoastGuardInteractive/media/mission-ice.jpg', '/CoastGuardInteractive/')).toBe('/CoastGuardInteractive/media/mission-ice.jpg')
    expect(publicAsset('https://example.org/research.jpg', '/CoastGuardInteractive/')).toBe('https://example.org/research.jpg')
    expect(publicAsset('//example.org/research.jpg', '/CoastGuardInteractive/')).toBe('//example.org/research.jpg')
  })

  it('shows an honest accessible failure state instead of substituting rejected photography', () => {
    render(<SafeImage src="https://example.org/research.jpg" alt="Antarctic research station" className="port-img" />)
    fireEvent.error(screen.getByRole('img'))
    const fallback = screen.getByTestId('media-unavailable')
    expect(fallback).toHaveAccessibleName('Photograph unavailable: Antarctic research station')
    expect(fallback).toHaveClass('port-img')
    expect(fallback).toHaveTextContent('Photograph unavailable')
    expect(document.querySelector('img')).toBeNull()
  })

  it('allows a new source to load after the previous source failed', () => {
    const { rerender } = render(<SafeImage src="https://example.org/failed.jpg" alt="First photo" />)
    fireEvent.error(screen.getByRole('img'))
    rerender(<SafeImage src="/media/mission-ice.jpg" alt="Polar Star breaking ice" />)
    expect(screen.queryByTestId('media-unavailable')).not.toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', '/media/mission-ice.jpg')
  })
})
