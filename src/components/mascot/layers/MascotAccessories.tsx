import type { AvatarCharacterLook } from '../../../types/profile'
import { getHeadAnchors } from '../anchors/headAnchors'

type Props = Pick<AvatarCharacterLook, 'glasses' | 'headwear'> & {
  suppressHeadwear?: boolean
}

export function MascotAccessories({ glasses, headwear, suppressHeadwear }: Props) {
  const anchors = getHeadAnchors()
  const { HEAD_CENTER: { x: cx }, HEAD_TOP, EYE_LINE, FOREHEAD } = anchors
  const headTop = HEAD_TOP.y
  const faceY = EYE_LINE.y

  return (
    <g aria-label="accessoires">
      {glasses === 'round' ? (
        <g fill="none" stroke="#1e293b" strokeWidth={1.1}>
          <circle cx={cx - 9} cy={faceY - 1} r={5.5} />
          <circle cx={cx + 9} cy={faceY - 1} r={5.5} />
          <path d={`M ${cx - 3.5} ${faceY - 1} L ${cx + 3.5} ${faceY - 1}`} />
        </g>
      ) : null}
      {glasses === 'sport' ? (
        <rect x={cx - 17} y={faceY - 5} width={34} height={10} rx={2.5} fill="rgba(30,58,138,.22)" stroke="#1e293b" strokeWidth={0.9} />
      ) : null}

      {!suppressHeadwear && headwear === 'beanie' ? (
        <path
          d={`M ${cx - 24} ${headTop + 10} Q ${cx} ${FOREHEAD.y - 6} ${cx + 24} ${headTop + 10} L ${cx + 22} ${headTop + 18} L ${cx - 22} ${headTop + 18} Z`}
          fill="#1e293b"
        />
      ) : null}
      {!suppressHeadwear && headwear === 'cap' ? (
        <g>
          <ellipse cx={cx} cy={headTop + 6} rx={26} ry={9} fill="#0f172a" />
          <path d={`M ${cx - 6} ${headTop + 10} L ${cx + 30} ${headTop + 14} L ${cx + 28} ${headTop + 18} Z`} fill="#1e293b" />
        </g>
      ) : null}
    </g>
  )
}
