import { useRef } from 'react'
import type { Object3D } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { PopAvatarStudioRig, BUST_LOOKAT_Y } from './pop/PopAvatarStudioRig'
import type { PopAvatarConfig } from './pop/resolvePopAvatarConfig'

type AvatarScene3DProps = {
  config: PopAvatarConfig
  groupRotationY?: number
}

function useIdleWobble() {
  const g = useRef<Object3D | null>(null)
  const { clock } = useThree()
  useFrame(() => {
    if (!g.current) return
    g.current.position.y = Math.sin(clock.elapsedTime * 0.4) * 0.0015
  })
  return g
}

/**
 * Vue 3D éditeur : sol + mêmes lumières/HDRI que la vignette, orbit + balancement léger.
 */
export function AvatarScene3D({ config, groupRotationY = -0.14 }: AvatarScene3DProps) {
  const groupRef = useIdleWobble()
  return (
    <group ref={groupRef}>
      <PopAvatarStudioRig
        config={config}
        showGround
        groupRotationY={groupRotationY}
        enableKeyShadows
      />
      <OrbitControls
        makeDefault
        target={[0, BUST_LOOKAT_Y, 0]}
        /** Plus de liberté en hauteur pour viser l’arrière (dos / nuque) sans rester quasiment en plongée. */
        minPolarAngle={0.42}
        maxPolarAngle={Math.PI / 2 - 0.04}
        minDistance={0.8}
        maxDistance={3.0}
        enablePan={false}
        enableDamping
        dampingFactor={0.085}
        rotateSpeed={1.1}
        zoomSpeed={0.85}
      />
    </group>
  )
}
