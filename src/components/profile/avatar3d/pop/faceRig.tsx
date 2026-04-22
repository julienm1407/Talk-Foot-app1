import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { PopAvatarConfig } from './resolvePopAvatarConfig'
export type PopFaceExpr = {
  mouthRot: number
  browZ: number
  eyeScale: number
  mouthY: number
}

export type PopFaceMats = {
  faceSkin: THREE.Material
  skin: THREE.Material
  cheek: THREE.Material
  periocular: THREE.Material
  sclera: THREE.Material
  iris: THREE.Material
  pupil: THREE.Material
  cornea: THREE.Material
  eyelid: THREE.Material
  lip: THREE.Material
  hair: THREE.Material
}

function useBlinkW() {
  const w = useRef(0)
  const state = useRef<'idle' | 'close' | 'open'>('idle')
  const tNext = useRef(0.2 + Math.random() * 2.4)
  const { invalidate } = useThree()

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    if (state.current === 'idle' && t > tNext.current) {
      state.current = 'close'
    } else if (state.current === 'close') {
      w.current = Math.min(1, w.current + dt * 12)
      invalidate()
      if (w.current >= 0.99) state.current = 'open'
    } else if (state.current === 'open') {
      w.current = Math.max(0, w.current - dt * 10)
      invalidate()
      if (w.current <= 0.02) {
        w.current = 0
        state.current = 'idle'
        tNext.current = t + 1.3 + Math.random() * 3.4
      }
    }
  })
  return w
}

/**
 * Anneau d’ombrage (AO « doux ») sous l’arcade — opaque, teinte plus sombre, pas d’alpha.
 */
function PeriocularRing({ mx, my, mats }: { mx: number; my: number; mats: PopFaceMats }) {
  return (
    <mesh
      position={[mx, my, 0.1205]}
      material={mats.periocular}
      rotation={[-0.5, 0, mx * 0.2]}
    >
      <ringGeometry args={[0.011, 0.022, 20]} />
    </mesh>
  )
}

type EyeP = { side: -1 | 1; mats: PopFaceMats; ex: PopFaceExpr; look: PopAvatarConfig['look'] }

/**
 * Sclère (ellipsoïde léger) + iris + pupille + catchlight, volumes séparés, relief sur la tête.
 */
function EyeAssembly({ side, mats, ex, look }: EyeP) {
  const al = look.eyeShape === 'almond'
  const sx = al ? 0.9 : 1
  const sy = al ? 1.05 : 1
  const sz = al ? 0.9 : 1
  const x = 0.0515 * side
  const re = 0.0188 * ex.eyeScale
  return (
    <group position={[x, 0.03, 0.101]}>
      <mesh
        material={mats.sclera}
        castShadow
        receiveShadow
        scale={[re * sx, re * sy, re * sz] as [number, number, number]}
      >
        <sphereGeometry args={[1, 36, 28]} />
      </mesh>
      <mesh
        position={[0, 0, re * sz * 0.7]}
        material={mats.iris}
        castShadow
        receiveShadow
        scale={ex.eyeScale}
      >
        <sphereGeometry args={[0.0078, 28, 20]} />
      </mesh>
      <mesh
        position={[0, 0, re * sz * 0.8]}
        material={mats.pupil}
        castShadow
        receiveShadow
        scale={ex.eyeScale * 0.9}
      >
        <sphereGeometry args={[0.0038, 12, 10]} />
      </mesh>
      <mesh
        position={[0.0018 * side, 0.0012, re * sz * 0.88]}
        material={mats.cornea}
        renderOrder={1}
        scale={0.03}
      >
        <sphereGeometry args={[0.1, 8, 6]} />
      </mesh>
    </group>
  )
}

function LidsOnEye({ side, mats, wBlink, ex: _e }: { side: -1 | 1; mats: PopFaceMats; wBlink: React.MutableRefObject<number>; ex: PopFaceExpr }) {
  const upperG = useRef<THREE.Group>(null)
  const lowerG = useRef<THREE.Group>(null)
  const x = 0.0515 * side
  const re = 0.0192

  useFrame(() => {
    const w = wBlink.current
    if (upperG.current) upperG.current.rotation.x = -0.35 - w * 0.75
    if (lowerG.current) lowerG.current.rotation.x = 0.2 + w * 0.45
  })

  return (
    <group position={[x, 0.03, 0.101]}>
      <group ref={upperG} position={[0, 0.008, re]}>
        <mesh material={mats.eyelid} castShadow receiveShadow>
          <sphereGeometry args={[re * 1.05, 20, 16, 0, Math.PI * 0.4, 0, Math.PI * 2]} />
        </mesh>
      </group>
      <group ref={lowerG} position={[0, -0.006, re]}>
        <mesh material={mats.eyelid} castShadow receiveShadow>
          <sphereGeometry args={[re * 0.95, 18, 12, Math.PI * 0.55, Math.PI * 0.45, 0, Math.PI * 2]} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Lèvres haute / basse, volumes explicites.
 */
function MouthRig({ mats, expr }: { mats: PopFaceMats; expr: PopFaceExpr }) {
  const y = -0.045 + expr.mouthY
  return (
    <group position={[0, y, 0.131]}>
      <mesh
        position={[0, 0.007, 0.003]}
        material={mats.lip}
        castShadow
        receiveShadow
        rotation={[-0.1 - expr.mouthRot * 0.1, 0, 0]}
      >
        <boxGeometry args={[0.05, 0.013, 0.018]} />
      </mesh>
      <mesh
        position={[0, -0.007, 0.004]}
        material={mats.lip}
        castShadow
        receiveShadow
        rotation={[-0.38 + expr.mouthRot * 0.3, 0, 0]}
      >
        <boxGeometry args={[0.047, 0.015, 0.02]} />
      </mesh>
      <mesh position={[0, -0.01, 0.012]} material={mats.faceSkin} castShadow receiveShadow>
        <sphereGeometry args={[0.018, 10, 8]} />
      </mesh>
    </group>
  )
}

export function FaceHead({
  mats,
  c,
  expr,
}: {
  mats: PopFaceMats
  c: PopAvatarConfig
  expr: PopFaceExpr
}) {
  const look = c.look
  const wBlink = useBlinkW()
  return (
    <group position={[0, 0.76, 0]}>
      <mesh
        castShadow
        receiveShadow
        material={mats.faceSkin}
        scale={[1.15, 1.2, 1.08] as [number, number, number]}
      >
        <sphereGeometry args={[0.15, 40, 36]} />
      </mesh>

      <NoseRidge m={mats} />

      <PeriocularRing mx={-0.0515} my={0.02} mats={mats} />
      <PeriocularRing mx={0.0515} my={0.02} mats={mats} />

      {[-0.08, 0.08].map((xd) => (
        <mesh
          key={xd}
          position={[xd, -0.01, 0.106]}
          material={mats.cheek}
          castShadow
          receiveShadow
          scale={[0.5, 0.38, 0.25] as [number, number, number]}
        >
          <sphereGeometry args={[0.03, 14, 12]} />
        </mesh>
      ))}

      <EyeAssembly side={-1} mats={mats} ex={expr} look={look} />
      <EyeAssembly side={1} mats={mats} ex={expr} look={look} />
      <LidsOnEye side={-1} mats={mats} wBlink={wBlink} ex={expr} />
      <LidsOnEye side={1} mats={mats} wBlink={wBlink} ex={expr} />

      <mesh
        position={[-0.05, 0.07 + expr.browZ, 0.126]}
        rotation={[0, 0, 0.12 - expr.mouthRot * 0.2]}
        material={mats.hair}
        castShadow
      >
        <boxGeometry args={[0.06, 0.014, 0.012]} />
      </mesh>
      <mesh
        position={[0.05, 0.07 + expr.browZ, 0.126]}
        rotation={[0, 0, -0.12 + expr.mouthRot * 0.2]}
        material={mats.hair}
        castShadow
      >
        <boxGeometry args={[0.06, 0.014, 0.012]} />
      </mesh>

      <MouthRig mats={mats} expr={expr} />
    </group>
  )
}

function NoseRidge({ m }: { m: PopFaceMats }) {
  return (
    <RoundedBox
      args={[0.03, 0.048, 0.037]}
      radius={0.011}
      smoothness={2}
      position={[0, 0.012, 0.134]}
      castShadow
      receiveShadow
      material={m.faceSkin}
    />
  )
}
