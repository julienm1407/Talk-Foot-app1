import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { PopAvatarConfig } from './resolvePopAvatarConfig'
import * as Mat from './popMaterials'
import { createPopHairAndFuzzMaterial } from './popHairMaterial'
import { BeardRig, HairRig } from './hairAndBeardModels'
import { FaceHead } from './faceRig'
import type { FaceExpression } from '../../../../types/profile'

const EXPR: Record<
  FaceExpression,
  { mouthRot: number; browZ: number; eyeScale: number; mouthY: number }
> = {
  neutral: { mouthRot: 0, browZ: 0, eyeScale: 1, mouthY: 0 },
  happy: { mouthRot: 0.25, browZ: 0.04, eyeScale: 1.02, mouthY: 0.01 },
  hyped: { mouthRot: 0.4, browZ: 0.12, eyeScale: 1.08, mouthY: 0.02 },
  serious: { mouthRot: -0.1, browZ: -0.05, eyeScale: 0.98, mouthY: -0.01 },
}

function usePopMats(c: PopAvatarConfig) {
  const sig = useMemo(
    () =>
      JSON.stringify({
        sk: c.look.skinTone,
        ha: c.look.hairColor,
        ey: c.look.eyeColor,
        p: c.torso.primary,
        s: c.torso.secondary,
        sl: c.torso.stripeLight,
        pat: c.torso.pattern,
      }),
    [c],
  )
  const m = useMemo(() => {
    void sig
    return {
      skin: Mat.createSkinMaterial(c.look.skinTone),
      faceSkin: Mat.createFaceSkinMaterial(c.look.skinTone),
      cheek: Mat.createCheekBlushMaterial(c.look.skinTone),
      periocular: Mat.createPeriocularShadeMaterial(c.look.skinTone),
      hair: createPopHairAndFuzzMaterial(c.look.hairColor),
      fabricP: Mat.createFabricMaterial(c.torso.primary, 0.52),
      fabricS: Mat.createFabricMaterial(c.torso.secondary, 0.64),
      /** Lignes claires (hechter, bordures) */
      fabricT: Mat.createFabricMaterial(c.torso.stripeLight, 0.4),
      sclera: Mat.createScleraMaterial(),
      iris: Mat.createIrisMaterial(c.look.eyeColor),
      pupil: Mat.createPupilMaterial(),
      cornea: Mat.createCorneaGlintMaterial(),
      eyelid: Mat.createEyelidFleshMaterial(c.look.skinTone),
      lip: Mat.createLipMaterial(c.look.skinTone),
      glassF: Mat.createGlassesFrameMaterial(),
      glassL: Mat.createGlassesLensMaterial(),
      plasticAcc: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#94a3b8'),
        roughness: 0.5,
        metalness: 0.15,
        clearcoat: 0.3,
        envMapIntensity: 0.6,
      }),
    }
  }, [c, sig])

  useLayoutEffect(
    () => () => {
      Object.values(m).forEach((mat) => (mat as THREE.Material).dispose())
    },
    [m],
  )
  return m
}

type Rot3 = [number, number, number]

function TorsoPatternOverlays({ c, mats }: { c: PopAvatarConfig; mats: ReturnType<typeof usePopMats> }) {
  const p = c.torso.pattern
  const S = mats.fabricS
  const T = mats.fabricT
  const zf = 0.1205
  const zb = -0.1205

  /** Même feuille (XY) en façade + miroir dos (normale inversée). */
  const fb = (key: string, x: number, y: number, r: Rot3, w: number, h: number, m: THREE.Material) => (
    <group key={key}>
      <mesh position={[x, y, zf]} rotation={r} material={m} castShadow>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh
        position={[x, y, zb]}
        rotation={[r[0], r[1] + Math.PI, r[2]]}
        material={m}
        castShadow
      >
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  )

  if (p === 'solid') return null

  if (p === 'vertical') {
    return fb('v', 0, 0, [0, 0, 0], 0.1, 0.28, S)
  }

  if (p === 'horizontal') {
    return (
      <group>
        {fb('h1', 0, 0.1, [0, 0, 0], 0.32, 0.042, S)}
        {fb('h2', 0, 0, [0, 0, 0], 0.32, 0.042, S)}
        {fb('h3', 0, -0.1, [0, 0, 0], 0.32, 0.042, S)}
      </group>
    )
  }

  if (p === 'sash') {
    return fb('s1', 0, 0, [0, 0, 0.52], 0.12, 0.35, S)
  }

  if (p === 'hechter') {
    return (
      <group>
        {fb('hct-c', 0, 0, [0, 0, 0], 0.09, 0.3, S)}
        {fb('hct-tl', -0.1, 0, [0, 0, 0], 0.022, 0.3, T)}
        {fb('hct-tr', 0.1, 0, [0, 0, 0], 0.022, 0.3, T)}
      </group>
    )
  }

  if (p === 'hoops') {
    return (
      <group>
        {fb('k1', 0, 0.11, [0, 0, 0], 0.34, 0.03, S)}
        {fb('k2', 0, 0.04, [0, 0, 0], 0.34, 0.03, S)}
        {fb('k3', 0, -0.04, [0, 0, 0], 0.34, 0.03, S)}
        {fb('k4', 0, -0.11, [0, 0, 0], 0.34, 0.03, S)}
      </group>
    )
  }

  if (p === 'kit_mesh') {
    return (
      <group>
        {fb('km-h1', 0, 0.1, [0, 0, 0], 0.32, 0.02, S)}
        {fb('km-h2', 0, 0.02, [0, 0, 0], 0.32, 0.02, S)}
        {fb('km-h3', 0, -0.08, [0, 0, 0], 0.32, 0.02, S)}
        {fb('km-v1', -0.1, 0, [0, 0, 0], 0.02, 0.22, S)}
        {fb('km-v2', 0, 0, [0, 0, 0], 0.02, 0.24, S)}
        {fb('km-v3', 0.1, 0, [0, 0, 0], 0.02, 0.22, S)}
      </group>
    )
  }

  return null
}

function TorsoBlock({ c, mats }: { c: PopAvatarConfig; mats: ReturnType<typeof usePopMats> }) {
  return (
    <group position={[0, 0.38, 0]}>
      <group key={c.torso.pattern}>
        <RoundedBox
          args={[0.44, 0.36, 0.24]}
          radius={0.06}
          smoothness={3}
          castShadow
          receiveShadow
          material={mats.fabricP}
        />
        <TorsoPatternOverlays c={c} mats={mats} />
      </group>
    </group>
  )
}

function LegsBlock({ mats }: { mats: ReturnType<typeof usePopMats> }) {
  return (
    <group position={[0, 0.1, 0]}>
      <RoundedBox
        args={[0.38, 0.2, 0.2]}
        radius={0.05}
        smoothness={2}
        castShadow
        receiveShadow
        material={mats.fabricS}
      />
    </group>
  )
}

function Neck({ mats }: { mats: ReturnType<typeof usePopMats> }) {
  return (
    <mesh position={[0, 0.56, 0]} castShadow receiveShadow material={mats.skin}>
      <cylinderGeometry args={[0.1, 0.11, 0.1, 16]} />
    </mesh>
  )
}

function GlassesModel({
  g,
  mats,
}: {
  g: PopAvatarConfig['glasses']
  mats: ReturnType<typeof usePopMats>
}) {
  if (g === 'none') return null
  const isRound = g === 'round'
  return (
    <group position={[0, 0.76, 0.16]}>
      {isRound ? (
        <>
          <mesh position={[-0.05, 0.03, 0]} material={mats.glassF} castShadow>
            <torusGeometry args={[0.04, 0.0025, 8, 20]} />
          </mesh>
          <mesh position={[0.05, 0.03, 0]} material={mats.glassF} castShadow>
            <torusGeometry args={[0.04, 0.0025, 8, 20]} />
          </mesh>
          <mesh position={[0, 0.03, 0]} material={mats.glassF} castShadow>
            <boxGeometry args={[0.04, 0.008, 0.004]} />
          </mesh>
          <mesh position={[-0.05, 0.03, 0.003]} material={mats.glassL}>
            <circleGeometry args={[0.034, 16]} />
          </mesh>
          <mesh position={[0.05, 0.03, 0.003]} material={mats.glassL}>
            <circleGeometry args={[0.034, 16]} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[-0.05, 0.03, 0]} material={mats.glassF} castShadow>
            <boxGeometry args={[0.06, 0.045, 0.012]} />
          </mesh>
          <mesh position={[0.05, 0.03, 0]} material={mats.glassF} castShadow>
            <boxGeometry args={[0.06, 0.045, 0.012]} />
          </mesh>
          <mesh position={[0, 0.03, 0]} material={mats.glassF} castShadow>
            <boxGeometry args={[0.05, 0.006, 0.006]} />
          </mesh>
        </>
      )}
    </group>
  )
}

function HeadwearModel({ hw, mats }: { hw: PopAvatarConfig['headwear3d']; mats: ReturnType<typeof usePopMats> }) {
  if (hw === 'none') return null
  if (hw === 'beanie') {
    return (
      <group position={[0, 0.9, 0]}>
        <mesh position={[0, 0.04, 0]} material={mats.hair} castShadow>
          <sphereGeometry args={[0.16, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
      </group>
    )
  }
  if (hw === 'cap') {
    return (
      <group position={[0, 0.92, 0]} rotation={[-0.12, 0, 0]}>
        <mesh position={[0, 0, 0]} material={mats.fabricP} castShadow>
          <cylinderGeometry args={[0.14, 0.16, 0.08, 20]} />
        </mesh>
        <mesh position={[0, -0.02, 0.1]} material={mats.fabricS} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.012, 12]} />
        </mesh>
      </group>
    )
  }
  return null
}

function ScarfRig({ has, mats }: { has: boolean; mats: ReturnType<typeof usePopMats> }) {
  if (!has) return null
  return (
    <group position={[0, 0.5, 0]}>
      <mesh
        castShadow
        receiveShadow
        material={mats.fabricP}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.15, 0.032, 8, 28]} />
      </mesh>
    </group>
  )
}

function AccRig({ has, mats }: { has: boolean; mats: ReturnType<typeof usePopMats> }) {
  if (!has) return null
  return (
    <mesh position={[0.2, 0.42, 0.05]} castShadow material={mats.plasticAcc}>
      <boxGeometry args={[0.05, 0.08, 0.04]} />
    </mesh>
  )
}

function ArmRigs({ mats }: { mats: ReturnType<typeof usePopMats> }) {
  const arm = (x: number) => (
    <group key={x} position={[x, 0.4, 0.02]}>
      <mesh castShadow material={mats.fabricP} rotation={[0, 0, -0.2 * Math.sign(x)]}>
        <capsuleGeometry args={[0.05, 0.2, 5, 8]} />
      </mesh>
    </group>
  )
  return (
    <>
      {arm(-0.28)}
      {arm(0.28)}
    </>
  )
}

export function PopCharacter({ config, groupRotationY = 0 }: { config: PopAvatarConfig; groupRotationY?: number }) {
  const mats = usePopMats(config)
  const expr = EXPR[config.look.faceExpression] ?? EXPR.happy
  return (
    <group position={[0, 0, 0]} rotation-y={groupRotationY}>
      <LegsBlock mats={mats} />
      <TorsoBlock c={config} mats={mats} />
      <Neck mats={mats} />
      <FaceHead mats={mats} c={config} expr={expr} />
      <HairRig key={config.look.hairStyle} style={config.look.hairStyle} mat={mats.hair} />
      <BeardRig key={config.look.beard} variant={config.look.beard} mat={mats.hair} />
      <GlassesModel g={config.glasses} mats={mats} />
      <HeadwearModel hw={config.headwear3d} mats={mats} />
      <ScarfRig has={config.hasScarf} mats={mats} />
      <AccRig has={config.hasAccessory} mats={mats} />
      <ArmRigs mats={mats} />
    </group>
  )
}
