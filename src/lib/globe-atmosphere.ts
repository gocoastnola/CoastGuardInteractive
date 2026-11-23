import type {
  FillLayerSpecification,
  Map as MLMap,
  StyleImageInterface,
} from 'maplibre-gl'

/** Subtle animated ocean highlight on the underlying vector fallback. */
const OCEAN_IMAGE = 'journey-illustrative-ocean'
const FPS = 15
const installations = new WeakMap<MLMap, () => void>()
type FillPattern = NonNullable<FillLayerSpecification['paint']>['fill-pattern']

function smoothstep(low: number, high: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)))
  return t * t * (3 - 2 * t)
}

function paintOcean(pixels: Uint8Array, seconds: number): void {
  const tau = Math.PI * 2
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      // Integer spatial periods make the 64 px tile seamless in both axes.
      // Long, low-contrast meanders instead of crossing highlight grids: the
      // latter read as repeating bumps when a small tile wraps the whole globe.
      const meander = Math.sin(tau * y / 64 + seconds * 0.08) * 0.55
      const wave = Math.sin(tau * (x + y) / 64 + meander - seconds * 0.34)
      const sheen = Math.sin(tau * (x * 2 + y) / 64 + seconds * 0.17) * 0.25
      const broad = (wave + sheen) * 0.5
      const crest = smoothstep(0.7, 1, wave)
      const index = (y * 64 + x) * 4
      pixels[index] = Math.round(5 + broad + crest)
      pixels[index + 1] = Math.round(87 + broad * 2 + crest * 3)
      pixels[index + 2] = Math.round(137 + broad * 3 + crest * 4)
      pixels[index + 3] = 255
    }
  }
}

/** Install once per map. Calling again replaces this instance; cleanup is safe twice. */
export function installGlobeAtmosphere(map: MLMap, reduced: boolean): () => void {
  installations.get(map)?.()
  let disposed = false
  let clock = 0
  let lastTick = performance.now()
  let timer: number | null = null
  let waveFrame = -1
  const originalPatterns = new Map<string, FillPattern>()
  const pixels = new Uint8Array(64 * 64 * 4)
  paintOcean(pixels, 0)
  const ocean: StyleImageInterface = {
    width: 64, height: 64, data: pixels,
    render: () => {
      const frame = reduced ? 0 : Math.floor(clock * FPS)
      if (frame === waveFrame) return false
      waveFrame = frame
      paintOcean(pixels, reduced ? 0 : clock)
      return true
    },
  }
  const app = map.getContainer().closest<HTMLElement>('.app')
  const active = () => {
    const phase = app?.dataset.phase
    return !disposed && !document.hidden && phase !== 'dateEntry' && phase !== 'idle'
  }
  const stopTimer = () => {
    if (timer !== null) window.clearInterval(timer)
    timer = null
  }
  const syncAnimation = () => {
    stopTimer()
    lastTick = performance.now()
    if (reduced || !active()) return
    timer = window.setInterval(() => {
      const now = performance.now()
      clock += Math.min(0.15, (now - lastTick) / 1000)
      lastTick = now
      if (!disposed) map.triggerRepaint()
    }, 1000 / FPS)
  }
  const install = () => {
    if (disposed || !map.getStyle()) return
    try {
      if (!map.hasImage(OCEAN_IMAGE)) map.addImage(OCEAN_IMAGE, ocean, { pixelRatio: 1 })
      let waterLayers = 0
      for (const layer of map.getStyle().layers) {
        if (layer.type !== 'fill') continue
        const sourceLayer = 'source-layer' in layer ? layer['source-layer'] : ''
        const isWater = sourceLayer === 'water' || /^(water|ocean)([-_].*)?$/.test(layer.id)
        if (!isWater) continue
        if (!originalPatterns.has(layer.id)) originalPatterns.set(layer.id, map.getPaintProperty(layer.id, 'fill-pattern'))
        map.setPaintProperty(layer.id, 'fill-pattern', OCEAN_IMAGE)
        waterLayers++
      }
      map.getCanvas().dataset.globeOcean = waterLayers > 0 ? 'ready' : 'no-water-mask'
      map.getCanvas().dataset.globeOceanLayers = String(waterLayers)
      map.triggerRepaint()
    } catch (error) {
      // WebGL or a missing provider water layer is not a fatal application error.
      console.warn('[globe] Optional atmosphere installation unavailable:', error)
    }
  }
  const onStyle = () => {
    originalPatterns.clear()
    // MapView's provider palette and route layers finish before we choose order.
    queueMicrotask(install)
  }
  const onLost = () => { stopTimer() }
  const onRestored = () => { queueMicrotask(install); syncAnimation() }
  map.on('style.load', onStyle)
  map.on('webglcontextlost', onLost)
  map.on('webglcontextrestored', onRestored)
  document.addEventListener('visibilitychange', syncAnimation)
  const observer = app ? new MutationObserver(syncAnimation) : null
  if (app) observer?.observe(app, { attributes: true, attributeFilter: ['data-phase'] })
  if (map.isStyleLoaded()) queueMicrotask(install)
  syncAnimation()

  const cleanup = () => {
    if (disposed) return
    disposed = true
    stopTimer()
    observer?.disconnect()
    document.removeEventListener('visibilitychange', syncAnimation)
    map.off('style.load', onStyle)
    map.off('webglcontextlost', onLost)
    map.off('webglcontextrestored', onRestored)
    try {
      for (const [id, pattern] of originalPatterns) {
        if (map.getLayer(id)) map.setPaintProperty(id, 'fill-pattern', pattern)
      }
      if (map.hasImage(OCEAN_IMAGE)) map.removeImage(OCEAN_IMAGE)
      delete map.getCanvas().dataset.globeOcean
      delete map.getCanvas().dataset.globeOceanLayers
    } catch { /* The owning map may already have been removed. */ }
    if (installations.get(map) === cleanup) installations.delete(map)
  }
  installations.set(map, cleanup)
  return cleanup
}
