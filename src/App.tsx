import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { MapView, type JumpRequest, type MapHandle } from './components/MapView'
import { StationPanel } from './components/StationPanel'
import { Directory } from './components/Directory'
import { Hud } from './components/Hud'
import { DateEntry } from './components/Adventure/DateEntry'
import { JourneyOverlay, type Leg } from './components/Adventure/JourneyOverlay'
import { SlotMachine } from './components/Adventure/SlotMachine'
import { ShipIntro } from './components/Adventure/ShipIntro'
import { PatrolOverlay } from './components/Adventure/PatrolOverlay'
import { TrainingAct } from './components/Adventure/TrainingAct'
import { UNITS, unitById } from './lib/units'
import { useMediaQuery } from './hooks/useMediaQuery'
import type { JumpTarget } from './lib/camera'
import { INITIAL_JOURNEY, isCinematic, journeyReducer } from './journey/machine'
import { POLAR_STAR_ID } from './journey/patrol'
import { CAPE_MAY } from './journey/constants'
import { LABELS } from './journey/copy'
import { sound } from './lib/audio'
import type { LngLat } from './journey/arc'

export default function App() {
  const [journey, dispatch] = useReducer(journeyReducer, INITIAL_JOURNEY)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [directoryOpen, setDirectoryOpen] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [jump, setJump] = useState<JumpRequest | null>(null)
  const isNarrow = useMediaQuery('(max-width: 860px)')
  const mapRef = useRef<MapHandle>(null)
  // The handle is set after the first commit; re-render once so overlays receive it.
  const [mapReady, setMapReady] = useState(false)
  useEffect(() => {
    if (mapRef.current) setMapReady(true)
  }, [])

  const { phase } = journey
  // Adaptive original score follows the existing story; no narrative changes.
  useEffect(() => {
    if (phase === 'dateEntry' || phase === 'idle') { sound.stopScore(); return }
    if (phase === 'act1') sound.score('training')
    else if (phase === 'orders') sound.score('orders')
    else if (phase === 'act2' || phase === 'shipIntro') sound.score('arrival')
    else if (phase === 'patrol') sound.score('patrol')
    else sound.score('explore')
  }, [phase])
  const mapActive = phase !== 'dateEntry' && phase !== 'idle'
  const cinematic = isCinematic(phase) || phase === 'orders'
  const selected = unitById(selectedId)
  const firstUnit = unitById(journey.firstUnitId)

  const select = useCallback(
    (id: string) => {
      setSelectedId(id)
      setJump(null)
      if (isNarrow) setDirectoryOpen(false)
    },
    [isNarrow],
  )

  const closePanel = useCallback(() => setSelectedId(null), [])

  const doJump = (target: JumpTarget) => {
    setSelectedId(null)
    setJump((prev) => ({ target, seq: (prev?.seq ?? 0) + 1 }))
  }

  /* ---------- adventure transitions ---------- */
  const begin = useCallback((shipDate: string) => {
    setSelectedId(null)
    // The assignment board always lands on Polar Star (owner decision, DECISIONS.md).
    dispatch({ type: 'START', shipDate, orderIds: [POLAR_STAR_ID] })
  }, [])

  const freeExplore = useCallback(() => dispatch({ type: 'FREE_EXPLORE' }), [])

  const act1Done = useCallback(({ skipped }: { skipped: boolean }) => {
    dispatch(skipped ? { type: 'SKIP_ACT' } : { type: 'ACT1_DONE' })
  }, [])

  const chooseOrder = useCallback((unitId: string) => dispatch({ type: 'CHOOSE_ORDER', unitId }), [])

  const act2Done = useCallback(({ skipped }: { skipped: boolean }) => {
    // Ship intro follows (panel selection happens after the patrol instead).
    dispatch(skipped ? { type: 'SKIP_ACT' } : { type: 'ACT2_DONE' })
  }, [])

  const shipIntroDone = useCallback(() => dispatch({ type: 'SHIP_INTRO_DONE' }), [])

  const patrolDone = useCallback(
    ({ skipped }: { skipped: boolean }) => {
      dispatch(skipped ? { type: 'SKIP_ACT' } : { type: 'PATROL_DONE' })
      // Land in explore with the Polar Star panel open (ribbon: "Your first unit").
      if (journey.firstUnitId) setSelectedId(journey.firstUnitId)
    },
    [journey.firstUnitId],
  )

  const restart = useCallback(() => {
    setSelectedId(null)
    setDirectoryOpen(false)
    setJump(null)
    mapRef.current?.stop()
    mapRef.current?.clearArc()
    mapRef.current?.setJourneyMarkers([])
    dispatch({ type: 'RESTART' })
  }, [])

  /* Orders phase: pull back for the slot board; explore: clear journey art. */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (phase === 'orders') {
      const polar = unitById(POLAR_STAR_ID)
      const pts: LngLat[] = [[CAPE_MAY.lng, CAPE_MAY.lat], ...(polar ? [[polar.lng, polar.lat] as LngLat] : [])]
      map.setJourneyMarkers([
        { id: CAPE_MAY.id, lngLat: [CAPE_MAY.lng, CAPE_MAY.lat], label: CAPE_MAY.name, sublabel: LABELS.bootCamp, kind: 'bootcamp' },
      ])
      map.fitPoints(pts, { duration: 2600, pitch: 20, maxZoom: 6, padding: { top: 120, bottom: isNarrow ? 420 : 300, left: 60, right: 60 } })
    }
    if (phase === 'explore') {
      map.clearArc()
      map.setJourneyMarkers([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Act 1 has no hometown arc any more (date-first landing): every later leg
  // originates at Cape May, so nothing downstream depends on a `home` point.

  const act2Leg = useMemo<Leg | null>(() => {
    if (!firstUnit) return null
    const dest: LngLat = [firstUnit.lng, firstUnit.lat]
    return {
      from: [CAPE_MAY.lng, CAPE_MAY.lat],
      to: dest,
      toShort: firstUnit.name,
      toName: firstUnit.name,
      markers: [
        { id: CAPE_MAY.id, lngLat: [CAPE_MAY.lng, CAPE_MAY.lat], label: CAPE_MAY.name, sublabel: LABELS.bootCamp, kind: 'bootcamp' },
        { id: firstUnit.id, lngLat: dest, label: firstUnit.name, sublabel: `${firstUnit.city}, ${firstUnit.state} · ${LABELS.firstUnit}`, kind: 'unit' },
      ],
    }
  }, [firstUnit])

  const showHud = phase === 'explore'

  return (
    <div
      className={`app phase-${phase} ${selected ? 'has-panel' : ''} ${directoryOpen ? 'has-directory' : ''}`}
      data-phase={phase}
    >
      <MapView
        ref={mapRef}
        units={UNITS}
        selectedId={selectedId}
        active={mapActive}
        cinematic={cinematic}
        highlightIds={phase === 'orders' ? journey.orderIds : null}
        panelOpen={!!selected}
        isNarrow={isNarrow}
        jump={jump}
        onSelect={select}
      />

      {showHud && (
        <Hud
          directoryOpen={directoryOpen}
          audioEnabled={audioEnabled}
          activeJump={selected ? null : (jump?.target ?? 'conus')}
          onToggleDirectory={() => setDirectoryOpen((v) => !v)}
          onToggleAudio={() => setAudioEnabled((v) => !v)}
          onJump={doJump}
          onRestart={restart}
        />
      )}

      {showHud && directoryOpen && (
        <Directory units={UNITS} selectedId={selectedId} onSelect={select} onClose={() => setDirectoryOpen(false)} />
      )}

      {showHud && selected && (
        <StationPanel
          unit={selected}
          isNarrow={isNarrow}
          audioEnabled={audioEnabled}
          ribbon={journey.firstUnitId === selected.id ? LABELS.ribbon : undefined}
          onEnableAudio={() => setAudioEnabled(true)}
          onClose={closePanel}
        />
      )}

      {phase === 'act1' && journey.shipDate && mapReady && (
        <TrainingAct shipDate={journey.shipDate} map={mapRef.current} onDone={act1Done} />
      )}

      {phase === 'orders' && <SlotMachine units={UNITS} onReport={chooseOrder} />}

      {phase === 'act2' && act2Leg && mapReady && (
        <JourneyOverlay act={2} leg={act2Leg} map={mapRef.current} onDone={act2Done} />
      )}

      {phase === 'shipIntro' && firstUnit && <ShipIntro unit={firstUnit} onBegin={shipIntroDone} />}

      {phase === 'patrol' && mapReady && <PatrolOverlay map={mapRef.current} onDone={patrolDone} />}

      {phase === 'dateEntry' && <DateEntry onBegin={begin} onExplore={freeExplore} />}
    </div>
  )
}
