import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  AttributionControl,
  Map as MLMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type ErrorEvent,
  type GeoJSONSource,
  type LngLatBoundsLike,
  type PaddingOptions,
  type SymbolLayerSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import '../styles/long-watch-map.css'
import '../styles/globe-map.css'
// MapLibre ≥5 loads its worker as a separate module relative to import.meta.url, which breaks under
// Vite's dep pre-bundling. Let Vite bundle/serve the worker and hand MapLibre the resulting URL.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
setWorkerUrl(maplibreWorkerUrl)
import type { Unit } from '../data/schema'
import { UNIT_TYPE_COLORS } from '../lib/units'
import { bearingFor, boundsFor, NATIONAL_VIEW, type JumpTarget } from '../lib/camera'
import { prefersReducedMotion } from '../lib/motion'
import { arcPrefix, boundsOf, type LngLat } from '../journey/arc'
import { globeOverviewZoom, voyageMidpoint } from '../lib/globe'
import { installGlobeAtmosphere } from '../lib/globe-atmosphere'

/** Keyless vector styles. Primary = OpenFreeMap; fallback = CARTO Dark Matter (both attribution-required). */
export const PRIMARY_STYLE = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/dark'
export const FALLBACK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export interface JumpRequest {
  target: JumpTarget
  seq: number
}

/** A labelled DOM marker used by the adventure (hometown, boot camp, first unit). */
export interface JourneyMarker {
  id: string
  lngLat: LngLat
  label: string
  sublabel?: string
  kind: 'home' | 'bootcamp' | 'unit'
}

export interface FitOptions {
  padding?: number | PaddingOptions
  /** Keep viewport insets during fitting so the camera retains the free chart area. */
  absolutePadding?: boolean
  pitch?: number
  bearing?: number
  duration?: number
  maxZoom?: number
}

/** Imperative surface used by the adventure overlay. Camera moves stay in MapLibre (see AGENTS.md). */
export interface MapHandle {
  /** Reveals `progress` (0..1) of a pre-sampled arc with a glowing head dot. */
  drawArc(points: LngLat[], progress: number): void
  clearArc(): void
  setJourneyMarkers(markers: JourneyMarker[]): void
  /** Frames every point (e.g. the whole arc) with optional pitch/bearing. */
  fitPoints(points: LngLat[], opts?: FitOptions): void
  /** Rotate one physical, broad-view sphere toward the current sea leg. */
  frameVoyageLeg(points: LngLat[], opts?: { duration?: number; reflow?: boolean }): void
  /** Same cinematic fly-in the station panel uses. */
  flyToUnit(unitId: string, opts?: { duration?: number }): void
  flyToPlace(lngLat: LngLat, opts?: { zoom?: number; pitch?: number; bearing?: number; duration?: number }): void
  easeTo(opts: { center?: LngLat; zoom?: number; pitch?: number; bearing?: number; duration: number }): void
  stop(): void
  getMap(): MLMap | null
}

interface Props {
  units: Unit[]
  selectedId: string | null
  /** False while the landing hero is up; flips true to trigger the national intro move. */
  active: boolean
  /** True while an adventure act owns the camera; unrelated exploration markers are hidden. */
  cinematic?: boolean
  /** Orders-board markers to emphasize; unrelated markers remain hidden during the story. */
  highlightIds?: string[] | null
  /** Whether the station panel currently occupies screen space (affects camera padding). */
  panelOpen: boolean
  isNarrow: boolean
  jump: JumpRequest | null
  onSelect: (id: string) => void
}

type Basemap = 'loading' | 'openfreemap' | 'carto' | 'failed'

const ARC_SRC = 'journey-arc'
const HEAD_SRC = 'journey-head'

const emptyLine = () => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: [] as LngLat[] } })
const pointAt = (p: LngLat) => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: p } })

export const MapView = forwardRef<MapHandle, Props>(function MapView(
  { units, selectedId, active, cinematic = false, highlightIds = null, panelOpen, isNarrow, jump, onSelect },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const markersRef = useRef<globalThis.Map<string, { marker: Marker; el: HTMLButtonElement }>>(new globalThis.Map())
  const journeyMarkersRef = useRef<Marker[]>([])
  const arcState = useRef<{ points: LngLat[]; progress: number } | null>(null)
  const styleReady = useRef(false)
  const storyLabelVisibility = useRef(new globalThis.Map<string, NonNullable<SymbolLayerSpecification['layout']>['visibility']>())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const cinematicRef = useRef(cinematic)
  cinematicRef.current = cinematic
  const activeRef = useRef(active)
  activeRef.current = active
  const driftTimer = useRef<number | null>(null)
  const [basemap, setBasemap] = useState<Basemap>('loading')
  const [projection, setProjection] = useState('loading')
  const [worldCopies, setWorldCopies] = useState<boolean | undefined>(undefined)

  const cameraPadding = () =>
    panelOpen
      ? isNarrow
        ? { top: 40, bottom: Math.round(window.innerHeight * 0.6), left: 20, right: 20 }
        : { top: 80, bottom: 80, left: 60, right: 440 + 40 }
      : NATIONAL_VIEW.padding

  const syncMarkerAccess = () => {
    const map = mapRef.current
    const viewport = map?.getContainer()
    const width = viewport?.clientWidth ?? 0
    const height = viewport?.clientHeight ?? 0
    markersRef.current.forEach(({ marker, el }) => {
      const hiddenForStory = !activeRef.current || cinematicRef.current
      const covered = el.classList.contains('maplibregl-marker-covered')
      // Native covered-state updates intentionally stop outside the viewport.
      // Keep those offscreen buttons out of keyboard/ARIA navigation too.
      const point = map?.project(marker.getLngLat())
      const offset = marker.getOffset()
      const x = point ? point.x + offset.x : Number.NaN
      const y = point ? point.y + offset.y : Number.NaN
      const offscreen = !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > width || y > height
      el.hidden = hiddenForStory
      el.style.display = hiddenForStory ? 'none' : ''
      if (hiddenForStory || covered || offscreen) {
        el.setAttribute('aria-hidden', 'true')
        el.tabIndex = -1
        if (document.activeElement === el) el.blur()
      } else {
        el.removeAttribute('aria-hidden')
        el.removeAttribute('tabindex')
      }
    })
  }

  const syncStoryLabels = (map: MLMap) => {
    if (!styleReady.current) return
    for (const layer of map.getStyle().layers ?? []) {
      // The current port is supplied by our journey marker. Keep broad country
      // and ocean context without a competing atlas of states, towns and roads.
      if (layer.type !== 'symbol' || !/^(place_(other|suburb|village|town|city|state)|highway_name)/.test(layer.id)) continue
      if (cinematicRef.current) {
        if (!storyLabelVisibility.current.has(layer.id)) {
          storyLabelVisibility.current.set(layer.id, map.getLayoutProperty(layer.id, 'visibility'))
        }
        map.setLayoutProperty(layer.id, 'visibility', 'none')
      } else if (storyLabelVisibility.current.has(layer.id)) {
        map.setLayoutProperty(layer.id, 'visibility', storyLabelVisibility.current.get(layer.id))
        storyLabelVisibility.current.delete(layer.id)
      }
    }
  }

  /* Retain the provider's geographic data while giving the voyage a rich ocean chart. */
  const applyChartPalette = (map: MLMap) => {
    const layers = map.getStyle().layers ?? []
    for (const layer of layers) {
      if (layer.type === 'background') map.setPaintProperty(layer.id, 'background-color', '#204e60')
      if (layer.type === 'fill') {
        const sourceLayer = layer['source-layer']
        if (sourceLayer === 'water') map.setPaintProperty(layer.id, 'fill-color', '#06385b')
        else if (/ice_shelf|glacier/.test(layer.id)) map.setPaintProperty(layer.id, 'fill-color', '#9ac4d3')
        else if (/wood|park/.test(layer.id)) map.setPaintProperty(layer.id, 'fill-color', '#1d514f')
        else if (/residential|building/.test(layer.id)) map.setPaintProperty(layer.id, 'fill-color', '#234754')
      }
      if (layer.type === 'line') {
        if (layer['source-layer'] === 'waterway') map.setPaintProperty(layer.id, 'line-color', '#2b7fa0')
        else if (layer['source-layer'] === 'boundary') map.setPaintProperty(layer.id, 'line-color', '#6596a6')
      }
      if (layer.type === 'symbol' && layer.layout?.['text-field']) {
        map.setPaintProperty(layer.id, 'text-color', layer['source-layer'] === 'water_name' ? '#72b6cf' : '#b7d1da')
        map.setPaintProperty(layer.id, 'text-halo-color', '#103347')
        map.setPaintProperty(layer.id, 'text-halo-width', 1.2)
      }
    }
    // Do not outline tiled water polygons: their clipped edges include tile and
    // antimeridian seams, which would draw false meridians through the ocean.
  }

  /* ---------- journey arc layers (idempotent; re-run after a style swap) ---------- */
  const ensureArcLayers = (map: MLMap) => {
    if (!styleReady.current || map.getSource(ARC_SRC)) return
    map.addSource(ARC_SRC, { type: 'geojson', data: emptyLine() })
    map.addSource(HEAD_SRC, { type: 'geojson', data: pointAt([0, 0]) })
    map.addLayer({
      id: 'journey-arc-glow',
      type: 'line',
      source: ARC_SRC,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#28c4e0', 'line-width': 9, 'line-opacity': 0.35, 'line-blur': 4 },
    })
    map.addLayer({
      id: 'journey-arc-line',
      type: 'line',
      source: ARC_SRC,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#f4bd56', 'line-width': 3, 'line-opacity': 1 },
    })
    map.addLayer({
      id: 'journey-head-halo',
      type: 'circle',
      source: HEAD_SRC,
      paint: { 'circle-radius': 12, 'circle-color': '#44d9ec', 'circle-opacity': 0.35, 'circle-blur': 0.85 },
    })
    map.addLayer({
      id: 'journey-head-dot',
      type: 'circle',
      source: HEAD_SRC,
      paint: { 'circle-radius': 4, 'circle-color': '#fff0cd', 'circle-stroke-color': '#f4bd56', 'circle-stroke-width': 1.3 },
    })
  }

  const applyArc = (map: MLMap) => {
    ensureArcLayers(map)
    const arcSrc = map.getSource(ARC_SRC) as GeoJSONSource | undefined
    const headSrc = map.getSource(HEAD_SRC) as GeoJSONSource | undefined
    if (!arcSrc || !headSrc) return
    const state = arcState.current
    if (!state) {
      arcSrc.setData(emptyLine())
      for (const id of ['journey-head-halo', 'journey-head-dot']) map.setLayoutProperty(id, 'visibility', 'none')
      return
    }
    const { line, head } = arcPrefix(state.points, state.progress)
    const feature = emptyLine()
    feature.geometry.coordinates = line
    arcSrc.setData(feature)
    headSrc.setData(pointAt(head))
    const showHead = state.progress > 0.005 && state.progress < 0.995 ? 'visible' : 'none'
    for (const id of ['journey-head-halo', 'journey-head-dot']) map.setLayoutProperty(id, 'visibility', showHead)
  }

  /* ---------- imperative handle ---------- */
  useImperativeHandle(
    ref,
    (): MapHandle => ({
      drawArc(points, progress) {
        arcState.current = { points, progress }
        if (mapRef.current) applyArc(mapRef.current)
      },
      clearArc() {
        arcState.current = null
        if (mapRef.current) applyArc(mapRef.current)
      },
      setJourneyMarkers(markers) {
        journeyMarkersRef.current.forEach((m) => m.remove())
        journeyMarkersRef.current = []
        const map = mapRef.current
        if (!map) return
        for (const [index, jm] of markers.entries()) {
          const el = document.createElement('div')
          el.className = `journey-marker journey-marker--${jm.kind}${index === markers.length - 1 ? ' is-current' : ''}`
          el.dataset.testid = `journey-marker-${jm.kind}`
          el.innerHTML =
            `<span class="jm-pulse"></span><span class="jm-ring"></span><span class="jm-dot"></span>` +
            `<span class="jm-label"><strong>${escapeHtml(jm.label)}</strong>${jm.sublabel ? `<small>${escapeHtml(jm.sublabel)}</small>` : ''}</span>`
          const marker = new Marker({ element: el, anchor: 'center', opacityWhenCovered: 0 }).setLngLat(jm.lngLat).addTo(map)
          journeyMarkersRef.current.push(marker)
        }
      },
      fitPoints(points, opts = {}) {
        const map = mapRef.current
        if (!map || points.length === 0) return
        map.stop()
        const padding = opts.padding ?? { top: 140, bottom: 160, left: 80, right: 80 }
        // Commit the scene insets before calculating the first fitted camera.
        // Otherwise Mercator's constraint can calculate against the previous scene.
        if (opts.absolutePadding) {
          map.setPadding(typeof padding === 'number'
            ? { top: padding, bottom: padding, left: padding, right: padding }
            : padding)
        }
        map.fitBounds(boundsOf(points) as LngLatBoundsLike, {
          padding,
          absolutePadding: opts.absolutePadding ?? false,
          pitch: opts.pitch ?? 0,
          bearing: opts.bearing ?? 0,
          maxZoom: opts.maxZoom ?? 8,
          duration: prefersReducedMotion() ? 0 : (opts.duration ?? 2000),
          essential: true,
        })
      },
      frameVoyageLeg(points, opts = {}) {
        const map = mapRef.current
        if (!map || !points.length) return
        const canvas = map.getContainer().getBoundingClientRect()
        const stage = document.querySelector('.voyage-globe-stage')?.getBoundingClientRect()
        const slot = stage && stage.width > 0 && stage.height > 0 ? stage : canvas
        const center = voyageMidpoint(points)
        const diameter = Math.min(slot.width, slot.height) * 0.92
        const padding = {
          top: Math.max(0, slot.top - canvas.top),
          bottom: Math.max(0, canvas.bottom - slot.bottom),
          left: Math.max(0, slot.left - canvas.left),
          right: Math.max(0, canvas.right - slot.right),
        }
        map.stop()
        if (opts.reflow) {
          // Rotation changes the layout immediately. Retain geographic position,
          // fit the sphere now, then continue the remaining passage below.
          map.jumpTo({
            padding,
            zoom: globeOverviewZoom(diameter, canvas.height, map.getCenter().lat, map.getVerticalFieldOfView()),
            bearing: -18,
            pitch: 0,
          })
        }
        const camera = {
          center,
          zoom: globeOverviewZoom(diameter, canvas.height, center[1], map.getVerticalFieldOfView()),
          bearing: -18,
          pitch: 0,
          padding,
        }
        if (prefersReducedMotion()) map.jumpTo(camera)
        else map.easeTo({ ...camera, duration: opts.duration ?? 2200, essential: true })
      },
      flyToUnit(unitId, opts = {}) {
        const map = mapRef.current
        const unit = units.find((u) => u.id === unitId)
        if (!map || !unit) return
        flyToUnitCamera(map, unit, cameraPadding(), opts.duration)
      },
      flyToPlace(lngLat, opts = {}) {
        const map = mapRef.current
        if (!map) return
        map.stop()
        const target = { center: lngLat, zoom: opts.zoom ?? 7, pitch: opts.pitch ?? 40, bearing: opts.bearing ?? 0 }
        if (prefersReducedMotion()) map.jumpTo(target)
        else map.flyTo({ ...target, duration: opts.duration ?? 2500, curve: 1.4, essential: true })
      },
      easeTo(opts) {
        const map = mapRef.current
        if (!map) return
        if (prefersReducedMotion()) {
          map.jumpTo({ center: opts.center, zoom: opts.zoom, pitch: opts.pitch, bearing: opts.bearing })
          return
        }
        map.easeTo({ ...opts, essential: true })
      },
      stop() {
        if (driftTimer.current !== null) {
          window.clearTimeout(driftTimer.current)
          driftTimer.current = null
        }
        mapRef.current?.stop()
      },
      getMap() {
        return mapRef.current
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [units, panelOpen, isNarrow],
  )

  const flyToUnitCamera = (map: MLMap, unit: Unit, padding: PaddingOptions, duration = 2800) => {
    if (driftTimer.current) {
      window.clearTimeout(driftTimer.current)
      driftTimer.current = null
    }
    const bearing = bearingFor(unit.id)
    const target = { center: [unit.lng, unit.lat] as [number, number], zoom: 10.6, pitch: 52, bearing, padding }
    map.stop()
    if (prefersReducedMotion()) {
      map.jumpTo(target)
      return
    }
    map.flyTo({ ...target, duration, curve: 1.6, speed: 0.9, essential: true })
    // gentle bearing drift once the fly-in settles
    driftTimer.current = window.setTimeout(() => {
      if (mapRef.current && !mapRef.current.isMoving()) {
        mapRef.current.easeTo({ bearing: bearing + 16, duration: 28000, easing: (t) => t })
      }
    }, duration + 200)
  }

  /* ---------- create map once ---------- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new MLMap({
      container: containerRef.current,
      style: PRIMARY_STYLE,
      center: [-96, 36],
      zoom: 0.8,
      pitch: 0,
      bearing: -18,
      // Whole-sphere polar framing can require negative zoom on a small phone.
      minZoom: -2,
      maxZoom: 16,
      maxPitch: 62,
      // One physical sphere; native globe shaders retain the antimeridian-safe route.
      renderWorldCopies: false,
      attributionControl: false,
    })
    mapRef.current = map
    map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right')
    map.addControl(new AttributionControl({ compact: true, customAttribution: [
      'Demo · unit data unverified',
      'Music: <a href="https://www.scottbuckley.com.au/library/vanguard/" target="_blank" rel="noopener noreferrer">Vanguard — Scott Buckley</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> (web mix/loop)',
    ] }), 'bottom-left')

    /* style fallback: if the primary style never loads, swap to CARTO once */
    let styleLoaded = false
    let fellBack = false
    const fallback = (why: string) => {
      if (styleLoaded || fellBack) return
      fellBack = true
      console.warn(`[map] primary style unavailable (${why}); falling back to CARTO Dark Matter`)
      map.setStyle(FALLBACK_STYLE)
    }
    map.once('style.load', () => {
      styleLoaded = true
      setBasemap(map.getStyle()?.name?.toLowerCase().includes('dark matter') ? 'carto' : 'openfreemap')
    })
    map.on('style.load', () => {
      // fires again after a fallback swap: re-create the journey layers if an arc is on screen
      styleReady.current = true
      storyLabelVisibility.current.clear()
      map.setProjection({ type: 'vertical-perspective' })
      setProjection(String(map.getProjection().type))
      setWorldCopies(map.getRenderWorldCopies())
      map.setSky({
        'sky-color': '#020c18',
        'horizon-color': '#62d6ed',
        'sky-horizon-blend': 0.15,
        'atmosphere-blend': 0.82,
      })
      applyChartPalette(map)
      syncStoryLabels(map)
      applyArc(map)
    })
    map.on('error', (e: ErrorEvent) => {
      if (!styleLoaded) fallback(e.error?.message ?? 'error')
    })
    const timeout = window.setTimeout(() => fallback('timeout'), 9000)
    map.once('style.load', () => window.clearTimeout(timeout))
    map.on('error', (e: ErrorEvent) => {
      if (fellBack && !styleLoaded) setBasemap('failed')
      if (import.meta.env.DEV) console.debug('[map]', e.error?.message)
    })

    /* markers */
    for (const u of units) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'unit-marker'
      el.style.setProperty('--c', UNIT_TYPE_COLORS[u.unitType])
      el.setAttribute('aria-label', `${u.name}, ${u.unitType}, ${u.city}, ${u.state}`)
      el.dataset.unitId = u.id
      el.dataset.testid = 'marker'
      el.innerHTML = `<span class="pulse"></span><span class="ring"></span><span class="dot"></span>` +
        `<span class="marker-tip" role="tooltip"><strong>${escapeHtml(u.name)}</strong><small>${escapeHtml(u.unitType)} · ${escapeHtml(u.city)}, ${escapeHtml(u.state)}</small></span>`
      el.addEventListener('click', (ev) => {
        ev.stopPropagation()
        onSelectRef.current(u.id)
      })
      const marker = new Marker({ element: el, anchor: 'center', opacityWhenCovered: 0 }).setLngLat([u.lng, u.lat]).addTo(map)
      markersRef.current.set(u.id, { marker, el })
    }
    const markerAccessObserver = new MutationObserver(syncMarkerAccess)
    markersRef.current.forEach(({ el }) => markerAccessObserver.observe(el, { attributes: true, attributeFilter: ['class'] }))
    const disposeAtmosphere = installGlobeAtmosphere(map, prefersReducedMotion())

    /* declutter: nudge markers that collide on screen apart (New Orleans cluster at national zoom) */
    const declutter = () => declutterMarkers(map, Array.from(markersRef.current.values())
      .filter(({ el }) => !el.hidden && !el.classList.contains('maplibregl-marker-covered'))
      .map(({ marker }) => marker))
    map.on('move', declutter)
    map.on('move', syncMarkerAccess)
    map.on('moveend', syncMarkerAccess)
    map.once('load', declutter)

    return () => {
      window.clearTimeout(timeout)
      disposeAtmosphere()
      markerAccessObserver.disconnect()
      if (driftTimer.current !== null) window.clearTimeout(driftTimer.current)
      driftTimer.current = null
      map.off('move', declutter)
      map.off('move', syncMarkerAccess)
      map.off('moveend', syncMarkerAccess)
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current.clear()
      journeyMarkersRef.current.forEach((m) => m.remove())
      journeyMarkersRef.current = []
      styleReady.current = false
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- landing → map intro (free explore only; the adventure frames its own shots) ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !active || cinematicRef.current) return
    map.stop()
    map.fitBounds(NATIONAL_VIEW.bounds, {
      padding: NATIONAL_VIEW.padding,
      pitch: 0,
      bearing: 0,
      duration: prefersReducedMotion() ? 0 : 2400,
      essential: true,
    })
  }, [active])

  /* ---------- marker emphasis: selection, orders highlight, cinematic isolation ---------- */
  useEffect(() => {
    syncMarkerAccess()
    const map = mapRef.current
    if (map) syncStoryLabels(map)
    markersRef.current.forEach(({ el }, id) => {
      const offered = !!highlightIds && highlightIds.includes(id)
      el.classList.toggle('is-selected', id === selectedId)
      el.classList.toggle('is-offered', offered && id !== selectedId)
      el.classList.toggle(
        'is-dimmed',
        (!!selectedId && id !== selectedId) || (!!highlightIds && !offered) || (cinematic && !highlightIds && !selectedId),
      )
    })
  }, [selectedId, highlightIds, cinematic, active])

  /* ---------- selection camera ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !active) return
    const unit = selectedId ? units.find((u) => u.id === selectedId) : null

    if (unit) {
      flyToUnitCamera(map, unit, cameraPadding())
    } else {
      if (driftTimer.current) {
        window.clearTimeout(driftTimer.current)
        driftTimer.current = null
      }
      if (cinematicRef.current) return // the act controls the camera
      map.stop()
      map.fitBounds(NATIONAL_VIEW.bounds, {
        padding: NATIONAL_VIEW.padding,
        pitch: 0,
        bearing: 0,
        duration: prefersReducedMotion() ? 0 : 2200,
        essential: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, active])

  /* ---------- quick-jump chips ---------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !jump) return
    map.stop()
    map.fitBounds(boundsFor(jump.target), {
      padding: cameraPadding(),
      pitch: jump.target === 'conus' ? 0 : 30,
      bearing: 0,
      maxZoom: 9.5,
      duration: prefersReducedMotion() ? 0 : 2000,
      essential: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump])

  return (
    <div className={`map-root globe-map ${cinematic ? 'is-cinematic' : ''}`} data-testid="map" data-projection={projection} data-world-copies={worldCopies === undefined ? 'loading' : String(worldCopies)}>
      <div ref={containerRef} className="map-canvas" />
      <div className="map-vignette" />
      {basemap === 'loading' && <div className="map-status">Loading basemap…</div>}
      {basemap === 'failed' && (
        <div className="map-status">Basemap unavailable (offline?). Markers still work.</div>
      )}
    </div>
  )
})

/**
 * Greedy screen-space declutter. Markers whose projected positions fall within
 * `radius` px of each other are spread evenly on a ring around their centroid;
 * everything else gets a zero offset. Cheap enough to run on every `move`.
 */
export function declutterMarkers(map: MLMap, markers: Marker[], radius = 22): void {
  const pts = markers.map((m) => map.project(m.getLngLat()))
  const assigned = new Array<number>(markers.length).fill(-1)
  const groups: number[][] = []
  for (let i = 0; i < markers.length; i++) {
    if (assigned[i] >= 0) continue
    const group = [i]
    assigned[i] = groups.length
    for (let j = i + 1; j < markers.length; j++) {
      if (assigned[j] >= 0) continue
      const near = group.some((k) => Math.hypot(pts[k].x - pts[j].x, pts[k].y - pts[j].y) < radius)
      if (near) {
        group.push(j)
        assigned[j] = groups.length
      }
    }
    groups.push(group)
  }
  for (const group of groups) {
    if (group.length === 1) {
      markers[group[0]].setOffset([0, 0])
      continue
    }
    const cx = group.reduce((s, k) => s + pts[k].x, 0) / group.length
    const cy = group.reduce((s, k) => s + pts[k].y, 0) / group.length
    const ring = radius * 0.75 + group.length * 2
    group.forEach((k, idx) => {
      const angle = -Math.PI / 2 + (idx / group.length) * Math.PI * 2
      const tx = cx + Math.cos(angle) * ring
      const ty = cy + Math.sin(angle) * ring
      markers[k].setOffset([tx - pts[k].x, ty - pts[k].y])
    })
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
