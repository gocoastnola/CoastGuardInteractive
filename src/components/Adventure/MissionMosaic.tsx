/**
 * Landing-page mission collage — four FULL-BLEED action photo panels behind the
 * hero (helicopter ops, a live rescue, a vessel fire response, Antarctic
 * icebreaking). Real DVIDS public-domain photography, bundled under /media
 * (ASSET_LICENSES.md), screened for action content by scripts/screen_images.py
 * plus a human visual pass — no ceremonies, no certificates.
 *
 * Each panel runs its own slow Ken Burns drift and pops in staggered; gradient
 * masks fuse the seams so it reads as one cinematic wall, not four boxes.
 */
const TILES = [
  {
    img: '/media/mission-aviation.jpg',
    label: 'Fly',
    sub: 'Aviation',
    alt: 'MH-65 Dolphin helicopter overhead with the hoist cable down',
  },
  {
    img: '/media/mission-sar.jpg',
    label: 'Save lives',
    sub: 'Search & Rescue',
    alt: 'Survivor in the water as a Coast Guard helicopter arrives overhead',
  },
  {
    img: '/media/mission-fire.jpg',
    label: 'Answer the call',
    sub: 'Emergency Response',
    alt: 'Burning vessel at sea seen from a responding Coast Guard boat',
  },
  {
    img: '/media/mission-ice.jpg',
    label: 'Go farther',
    sub: 'Polar Operations',
    alt: 'USCGC Polar Star carving a channel through Antarctic ice',
  },
] as const

export function MissionMosaic() {
  return (
    <div className="mission-mosaic" aria-hidden="false">
      {TILES.map((t, i) => (
        <figure className={`mosaic-tile mosaic-tile--${i}`} key={t.sub}>
          <img src={t.img} alt={t.alt} loading="eager" />
          <figcaption className="mosaic-label">
            <span className="mosaic-verb">{t.label}</span>
            <span className="mosaic-sub">{t.sub}</span>
          </figcaption>
        </figure>
      ))}
      <div className="mosaic-scrim" aria-hidden="true" />
    </div>
  )
}
