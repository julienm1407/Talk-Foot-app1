import type { BeardClipZone, HairClipZone } from './placementTypes'
import {
  beardChinClipPathD,
  beardJawClipPathD,
  beardMouthClipPathD,
  hairBackClipPathD,
  hairRingClipPathD,
  hairSidesClipPathD,
} from './headSafeArea'

export function hairClipUrl(uid: string, zone: HairClipZone): string {
  const id =
    zone === 'hairRing'
      ? `${uid}-clip-hair-ring`
      : zone === 'hairSides'
        ? `${uid}-clip-hair-sides`
        : zone === 'hairBack'
          ? `${uid}-clip-hair-back`
          : `${uid}-clip-hair-ring`
  return `url(#${id})`
}

export function beardClipUrl(uid: string, zone: BeardClipZone): string {
  const id =
    zone === 'beardMouth'
      ? `${uid}-clip-beard-mouth`
      : zone === 'beardChin'
        ? `${uid}-clip-beard-chin`
        : `${uid}-clip-beard-jaw`
  return `url(#${id})`
}

export function MascotAnchorClipDefs({ uid }: { uid: string }) {
  return (
    <>
      <clipPath id={`${uid}-clip-hair-ring`} clipPathUnits="userSpaceOnUse">
        <path fillRule="evenodd" d={hairRingClipPathD()} />
      </clipPath>
      <clipPath id={`${uid}-clip-hair-sides`} clipPathUnits="userSpaceOnUse">
        <path fillRule="evenodd" d={hairSidesClipPathD()} />
      </clipPath>
      <clipPath id={`${uid}-clip-hair-back`} clipPathUnits="userSpaceOnUse">
        <path d={hairBackClipPathD()} />
      </clipPath>
      <clipPath id={`${uid}-clip-beard-jaw`} clipPathUnits="userSpaceOnUse">
        <path fillRule="evenodd" d={beardJawClipPathD()} />
      </clipPath>
      <clipPath id={`${uid}-clip-beard-mouth`} clipPathUnits="userSpaceOnUse">
        <path d={beardMouthClipPathD()} />
      </clipPath>
      <clipPath id={`${uid}-clip-beard-chin`} clipPathUnits="userSpaceOnUse">
        <path d={beardChinClipPathD()} />
      </clipPath>
    </>
  )
}
