import { useState, type ImgHTMLAttributes } from 'react'
import { publicAsset } from '../lib/assets'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
}

/** Keep the scene and its caption usable when optional photography is unavailable. */
export function SafeImage({ src, alt, className = '', style, onError, ...props }: Props) {
  const resolved = publicAsset(src)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  if (failedSource === resolved) {
    return (
      <span
        className={`${className} media-unavailable`.trim()}
        style={style}
        role="img"
        aria-label={`Photograph unavailable: ${alt}`}
        data-testid="media-unavailable"
        data-media-src={resolved}
      >
        <span>Photograph unavailable</span>
      </span>
    )
  }
  return (
    <img
      {...props}
      src={resolved}
      alt={alt}
      className={className || undefined}
      style={style}
      onError={(event) => {
        setFailedSource(resolved)
        onError?.(event)
      }}
    />
  )
}
