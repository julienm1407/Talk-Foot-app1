import { hairBehindOnlyClipPathD, headMaskPathD, headMaskRingPathD } from './headMask'

export function HairClipDefs({ uid }: { uid: string }) {
  return (
    <>
      <clipPath id={`${uid}-head-mask`} clipPathUnits="userSpaceOnUse">
        <path d={headMaskPathD()} />
      </clipPath>
      <clipPath id={`${uid}-head-mask-ring`} clipPathUnits="userSpaceOnUse">
        <path fillRule="evenodd" d={headMaskRingPathD()} />
      </clipPath>
      <clipPath id={`${uid}-hair-behind`} clipPathUnits="userSpaceOnUse">
        <path d={hairBehindOnlyClipPathD()} />
      </clipPath>
    </>
  )
}
