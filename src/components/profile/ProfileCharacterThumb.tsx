import { useEffect, useRef, useState } from 'react'
import type { UserProfile } from '../../types/profile'
import { cn } from '../../utils/cn'
import { resolveModularAvatarState } from '../../features/avatar2d/modularAvatarState'
import { ModularAvatarHeadThumb } from './ModularAvatarCanvas'
import {
  MODULAR_PP_CHAT_FRAMING,
  MODULAR_PP_HEAD_RENDER_BASE_PX,
  MODULAR_PP_LEADERBOARD_FRAMING,
  MODULAR_PP_NAV_FRAMING,
} from './modularPPFraming'

export { MODULAR_PP_CHAT_FRAMING, MODULAR_PP_LEADERBOARD_FRAMING, MODULAR_PP_NAV_FRAMING }

const PRESETS = {
  xs: 28,
  sm: 40,
  md: 56,
  chat: 72,
  lg: 96,
} as const

function fillsParentShell(className?: string) {
  return Boolean(className && /(?:^|\s)!?(?:h|w)-full/.test(className))
}

export function ProfileCharacterThumb({
  profile,
  size = 'md',
  framingMode = 'auto',
  headOffsetPx = 0,
  headScale = 1,
  imagePriority = false,
  className,
  'aria-label': ariaLabel,
}: {
  profile: UserProfile
  size?: keyof typeof PRESETS
  framingMode?: 'auto' | 'topbar'
  headOffsetPx?: number
  headScale?: number
  /** Chargement immédiat des calques (vignette visible au-dessus de la ligne de flottaison). */
  imagePriority?: boolean
  peerFanClubId?: string | null
  className?: string
  'aria-label'?: string
}) {
  const thumbPx = PRESETS[size]
  const fillParent = fillsParentShell(className)
  const modularState = resolveModularAvatarState(profile.modularAvatar)
  const shellRef = useRef<HTMLDivElement>(null)
  const [renderState, setRenderState] = useState<{ shellSize: number; renderSize: number }>({
    shellSize: thumbPx,
    renderSize: thumbPx,
  })

  useEffect(() => {
    const el = shellRef.current
    if (!el) return

    const update = () => {
      const measured = Math.round(Math.min(el.clientWidth, el.clientHeight))
      const shellSize = Math.max(16, measured || thumbPx)
      let renderSize = shellSize
      if (framingMode === 'topbar') {
        renderSize =
          shellSize < MODULAR_PP_HEAD_RENDER_BASE_PX
            ? shellSize
            : Math.max(MODULAR_PP_HEAD_RENDER_BASE_PX, shellSize)
      } else if (shellSize < 32) {
        renderSize = thumbPx
      }
      setRenderState({ shellSize, renderSize })
    }

    update()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [thumbPx, framingMode])

  const scale =
    framingMode === 'topbar' && renderState.renderSize > 0
      ? renderState.shellSize / renderState.renderSize
      : 1

  return (
    <div
      ref={shellRef}
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border-2 border-tf-grey-pastel/50 bg-gradient-to-b from-[#0e1018] to-[#0a0c12]',
        fillParent && 'h-full w-full min-h-0 min-w-0',
        className,
      )}
      style={
        fillParent
          ? undefined
          : { width: thumbPx, height: thumbPx, minWidth: thumbPx, minHeight: thumbPx }
      }
      role="img"
      aria-label={ariaLabel ?? 'Photo de profil — tête de mon avatar modulaire'}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          style={{
            transform: `translateY(${headOffsetPx}px) scale(${scale * headScale})`,
            transformOrigin: 'center center',
          }}
        >
          <ModularAvatarHeadThumb
            state={modularState}
            size={renderState.renderSize}
            imagePriority={imagePriority}
          />
        </div>
      </div>
    </div>
  )
}
