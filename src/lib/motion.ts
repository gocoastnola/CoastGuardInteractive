/** Reduced-motion helpers shared by MapLibre camera code and GSAP tweens. */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Returns `0` when the user prefers reduced motion, otherwise the given seconds. */
export function dur(seconds: number): number {
  return prefersReducedMotion() ? 0 : seconds
}
