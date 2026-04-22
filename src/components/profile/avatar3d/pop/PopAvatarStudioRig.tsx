import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree, invalidate } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { PopCharacter } from './PopCharacter'
import type { PopAvatarConfig } from './resolvePopAvatarConfig'

export const BUST_LOOKAT_Y = 0.42
/** Cadrage type portrait (miniatures) : plus proche, visage / haut de buste. */
const PORTRAIT_LOOKAT_Y = 0.54

const GROUND_Y = 0.001

function KeyLight({ enableShadows }: { enableShadows: boolean }) {
  const ref = useRef<THREE.DirectionalLight>(null)
  useLayoutEffect(() => {
    if (!ref.current) return
    const l = ref.current
    l.castShadow = enableShadows
    l.shadow.mapSize.set(1024, 1024)
    l.shadow.camera.near = 0.5
    l.shadow.camera.far = 32
    l.shadow.camera.left = -3.2
    l.shadow.camera.right = 3.2
    l.shadow.camera.top = 3.2
    l.shadow.camera.bottom = -3.2
    l.shadow.bias = -0.0002
  }, [enableShadows])

  return <directionalLight ref={ref} position={[2.6, 6.2, 1.6]} intensity={1.2} color="#fff6ef" />
}

function Ground() {
  return (
    <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10, 1, 1]} />
      <meshStandardMaterial
        color="#151821"
        metalness={0.1}
        roughness={0.9}
        envMapIntensity={0.45}
      />
    </mesh>
  )
}

/**
 * Même pipeline visuel (lumière studio + sol optionnel + HDRI) pour l’éditeur et les cartes 2D.
 */
export function PopAvatarStudioRig({
  config,
  showGround,
  groupRotationY = -0.14,
  enableKeyShadows = true,
  envIntensity = 0.75,
}: {
  config: PopAvatarConfig
  showGround: boolean
  groupRotationY?: number
  /** Désactiver l’ombre portée (miniatures denses) */
  enableKeyShadows?: boolean
  envIntensity?: number
}) {
  return (
    <group position={[0, GROUND_Y, 0]}>
      <hemisphereLight args={['#e6ecff', '#0a0c12', 0.28]} />
      <ambientLight intensity={0.22} color="#eef1f8" />
      <KeyLight enableShadows={enableKeyShadows} />
      <directionalLight
        position={[-2.4, 1.2, 1.8]}
        intensity={0.5}
        color="#c2d0f0"
        castShadow={false}
      />
      {/* Remplit le dos / épaules quand la caméra tourne derrière (sinon baigné d’ombre). */}
      <directionalLight
        position={[0.2, 1.35, -2.5]}
        intensity={0.42}
        color="#d8e4f8"
        castShadow={false}
      />
      <directionalLight position={[-0.2, 2, -2.2]} intensity={0.55} color="#4a5d8a" castShadow={false} />
      <pointLight position={[0.2, 1, 0.4]} intensity={0.2} color="#ffeee6" />
      {showGround && <Ground />}
      <PopCharacter config={config} groupRotationY={groupRotationY} />
      <Suspense fallback={null}>
        <Environment preset="studio" environmentIntensity={envIntensity} />
      </Suspense>
    </group>
  )
}

/**
 * `editor` : vue atelier (buste + sol) — même cadrage que l’Orbit cible.
 * `portrait` : zoom resserré (visage + épaules) pour les miniatures 2D / listes.
 */
export function BustCamera({ mode = 'editor' }: { mode?: 'editor' | 'portrait' }) {
  const { camera } = useThree()
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera
    if (mode === 'portrait') {
      c.position.set(0, 0.1, 1.32)
      c.fov = 27
    } else {
      c.position.set(0, 0.2, 2.15)
      c.fov = 32
    }
    c.near = 0.1
    c.far = 80
    c.updateProjectionMatrix()
    camera.up.set(0, 1, 0)
    const aimY = mode === 'portrait' ? PORTRAIT_LOOKAT_Y : BUST_LOOKAT_Y
    camera.lookAt(0, aimY, 0)
  }, [camera, mode])
  return null
}

/** `frameloop="demand"` : redessine quand le profil / look change. */
export function R3FInvalidateOn({ rev }: { rev: string }) {
  useLayoutEffect(() => {
    invalidate()
  }, [])
  useEffect(() => {
    invalidate()
  }, [rev])
  return null
}
