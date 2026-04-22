import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useFanPreferences } from '../../../contexts/FanPreferencesContext'
import type { UserProfile } from '../../../types/profile'
import { cn } from '../../../utils/cn'
import { AvatarScene3D } from './AvatarScene3D'
import { BustCamera } from './pop/PopAvatarStudioRig'
import { mergeCharacterLook } from '../../../data/characterPresets'
import { resolvePopAvatarConfig } from './pop/resolvePopAvatarConfig'

type ProfileAvatar3DViewProps = {
  profile: UserProfile
  className?: string
  /** Conservé pour compat (ancien flux capture 2D), ignoré. */
  captureContainer?: HTMLElement
}

/**
 * Avatar 3D « POP » modulaire (R3F) : peau / cheveux / tenue / accessoires,
 * éclairage type studio, HDRI — lié à `UserProfile` et au club favori.
 */
export function ProfileAvatar3DView({ profile, className, captureContainer: _capture }: ProfileAvatar3DViewProps) {
  void _capture
  const { favoriteClubId } = useFanPreferences()
  const lookKey = useMemo(
    () => JSON.stringify(mergeCharacterLook(profile.characterLook)),
    [profile.characterLook],
  )
  const config = useMemo(
    () => resolvePopAvatarConfig(profile, favoriteClubId ?? null),
    [profile, favoriteClubId, lookKey],
  )

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className={cn(
          'relative flex h-44 w-36 min-h-[176px] min-w-36 items-center justify-center',
          'overflow-hidden rounded-2xl border-2 border-tf-grey-pastel/50 bg-gradient-to-b from-[#0e1018] to-[#0a0c12]',
        )}
        style={{ touchAction: 'none' }}
      >
        <Canvas
          className="!absolute inset-0 size-full"
          shadows
          dpr={[1, 2]}
          frameloop="always"
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.12
            gl.outputColorSpace = THREE.SRGBColorSpace
            gl.shadowMap.enabled = true
            gl.shadowMap.type = THREE.PCFSoftShadowMap
            gl.setClearColor('#0a0b10', 1)
          }}
        >
          <color attach="background" args={['#0a0b10']} />
          <BustCamera mode="editor" />
          <Suspense fallback={null}>
            <AvatarScene3D config={config} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}
