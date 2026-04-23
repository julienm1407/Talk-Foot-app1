import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import type { UserProfile } from '../../types/profile'
import { cn } from '../../utils/cn'
import { PopAvatarStudioRig, BustCamera, R3FInvalidateOn } from './avatar3d/pop/PopAvatarStudioRig'
import { mergeCharacterLook } from '../../data/characterPresets'
import { resolvePopAvatarConfig } from './avatar3d/pop/resolvePopAvatarConfig'

const PRESETS = {
  sm: { box: 'h-12 w-12 min-h-12 min-w-12', dpr: 1 as const, shadows: false as const },
  md: { box: 'h-16 w-16 min-h-16 min-w-16', dpr: 1.5 as const, shadows: true as const },
  /** Salon / fil de messages : même buste qu’en profil, un peu plus grand pour la lisibilité. */
  chat: {
    box: 'h-[4.75rem] w-[4.75rem] min-h-[4.75rem] min-w-[4.75rem] sm:h-[5.25rem] sm:w-[5.25rem] sm:min-h-[5.25rem] sm:min-w-[5.25rem]',
    dpr: 1.5 as const,
    shadows: true as const,
  },
  lg: { box: 'h-24 w-24 min-h-24 min-w-24 sm:h-28 sm:w-28', dpr: 2 as const, shadows: true as const },
} as const

/**
 * Miniature d’**identité in-app** : le personnage 3D (POP) uniquement.
 * Indépendant de `profilePhotoDataUrl` (photo personnelle — gérée dans `ProfilePhotoSection`).
 */
export function ProfileCharacterThumb({
  profile,
  size = 'md',
  /** Club pour le dégradé « supporter » quand ce n’est pas le viewer (ex. autre user du chat). */
  peerFanClubId,
  className,
  'aria-label': ariaLabel,
}: {
  profile: UserProfile
  size?: keyof typeof PRESETS
  peerFanClubId?: string | null
  className?: string
  'aria-label'?: string
}) {
  const p = PRESETS[size]
  const { favoriteClubId } = useFanPreferences()
  const fanClubIdForResolve =
    peerFanClubId === undefined ? (favoriteClubId ?? null) : peerFanClubId || null
  const lookKey = useMemo(
    () => JSON.stringify(mergeCharacterLook(profile.characterLook)),
    [profile.characterLook],
  )
  const config = useMemo(
    () => resolvePopAvatarConfig(profile, fanClubIdForResolve),
    [profile, fanClubIdForResolve, lookKey],
  )
  const rev = useMemo(
    () =>
      JSON.stringify({
        c: config,
        s: size,
      }),
    [config, size],
  )

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-[22px] border-2 border-tf-grey-pastel/50 bg-gradient-to-b from-[#0e1018] to-[#0a0c12]',
        p.box,
        className,
      )}
      role="img"
      aria-label={ariaLabel ?? 'Mon personnage Talk Foot (avatar)'}
    >
      <Canvas
        className="!absolute inset-0 size-full"
        frameloop="demand"
        dpr={p.dpr}
        shadows={p.shadows}
        gl={{ antialias: true, alpha: false, powerPreference: 'default' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.12
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.shadowMap.enabled = p.shadows
          if (p.shadows) {
            gl.shadowMap.type = THREE.PCFSoftShadowMap
          }
          gl.setClearColor('#0a0b10', 1)
        }}
      >
        <color attach="background" args={['#0a0b10']} />
        <BustCamera mode="portrait" />
        <R3FInvalidateOn rev={rev} />
        <Suspense fallback={null}>
          <PopAvatarStudioRig
            config={config}
            showGround={false}
            enableKeyShadows={p.shadows}
            groupRotationY={-0.14}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
