import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { PopAvatarConfig } from './resolvePopAvatarConfig'

type Look = PopAvatarConfig['look']
type HairStyle = Look['hairStyle']
type Beard = Look['beard']

const Y = 0.76
/** Décale la coiffe légèrement **devant** la sphère peau (sinon cheveux longs / frisé invisibles — z-buffer). */
const SHELL = 0.04
const Z0 = 0.01
type M = THREE.Material

/** Tête rasée : calotte courte, bords lisses. */
function HairBuzz({ mat }: { mat: M }) {
  return (
    <group>
      <mesh
        position={[0, 0.012, SHELL + 0.003 + Z0]}
        material={mat}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[0.164, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
      </mesh>
    </group>
  )
}

/** Court : dôme + côtés (dégradés) pour le volume, pas seulement une demi-sphère. */
function HairShort({ mat }: { mat: M }) {
  return (
    <group>
      <mesh position={[0, 0.038, SHELL - 0.008 + Z0]} material={mat} castShadow receiveShadow>
        <sphereGeometry args={[0.172, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
      </mesh>
      <mesh
        position={[-0.105, 0.01, SHELL + 0.045 + Z0]}
        rotation={[0, 0.2, 0.35]}
        material={mat}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.016, 0.1, 6, 8]} />
      </mesh>
      <mesh
        position={[0.105, 0.01, SHELL + 0.045 + Z0]}
        rotation={[0, -0.2, -0.35]}
        material={mat}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.016, 0.1, 6, 8]} />
      </mesh>
    </group>
  )
}

/** Ondulé : dôme de base + bosses latérales pour lire l’ondulation. */
function HairWavy({ mat }: { mat: M }) {
  return (
    <group>
      <mesh
        position={[0, 0.038, SHELL - 0.006 + Z0]}
        material={mat}
        castShadow
        receiveShadow
        scale={[1.06, 0.95, 1.1]}
      >
        <sphereGeometry args={[0.17, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
      </mesh>
      {[
        { p: [-0.1, 0.04, 0.045] as [number, number, number], s: 0.038 as const },
        { p: [0.1, 0.04, 0.045] as [number, number, number], s: 0.038 as const },
        { p: [0, 0.1, 0.02] as [number, number, number], s: 0.04 as const },
        { p: [-0.06, 0.06, 0.064] as [number, number, number], s: 0.028 as const },
        { p: [0.06, 0.06, 0.064] as [number, number, number], s: 0.028 as const },
      ].map((b, i) => (
        <mesh
          key={i}
          position={[b.p[0], b.p[1], b.p[2] + SHELL + Z0]}
          material={mat}
          castShadow
          receiveShadow
          scale={[0.9, 0.75, 0.9]}
        >
          <sphereGeometry args={[b.s, 14, 12]} />
        </mesh>
      ))}
    </group>
  )
}

/** Dos long : volume central + mèches latérale + légère mèche d’arrière-train. */
function LongBackDrape({ mat }: { mat: M }) {
  /* Derrière la tête (Z < 0) : au-delà de la sphère peau (~-0,16) pour ne pas rester noyé dans le maillage. */
  const zBack = -0.14
  return (
    <group>
      <mesh
        position={[0, -0.1, zBack + Z0]}
        rotation={[0.28, 0, 0]}
        material={mat}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.056, 0.17, 8, 10]} />
      </mesh>
      <mesh
        position={[-0.048, -0.1, -0.11 + Z0]}
        rotation={[0.1, -0.18, 0.12]}
        material={mat}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.042, 0.15, 6, 8]} />
      </mesh>
      <mesh
        position={[0.048, -0.1, -0.11 + Z0]}
        rotation={[0.1, 0.18, -0.12]}
        material={mat}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.042, 0.15, 6, 8]} />
      </mesh>
      <mesh
        position={[0, -0.12, zBack - 0.02 + Z0]}
        rotation={[0.2, 0, 0]}
        material={mat}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.04, 0.08, 5, 6]} />
      </mesh>
    </group>
  )
}

function HairLong({ mat }: { mat: M }) {
  return (
    <group>
      <mesh position={[0, 0.04, SHELL + 0.02 + Z0]} material={mat} castShadow receiveShadow>
        <sphereGeometry args={[0.174, 32, 26, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
      </mesh>
      <LongBackDrape mat={mat} />
    </group>
  )
}

/** Frisé : 2 rangées de boules + volume central, pour une silhouette « bouclée » lisible. */
function HairCurly({ mat }: { mat: M }) {
  const u = 0.048
  return (
    <group>
      <mesh position={[0, 0.04, SHELL + 0.02 + Z0]} material={mat} castShadow receiveShadow>
        <sphereGeometry args={[0.174, 32, 26, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
      </mesh>
      {(
        [
          [0, -0.1, -0.12, u],
          [-0.05, -0.11, -0.1, 0.042],
          [0.05, -0.11, -0.1, 0.042],
          [-0.04, -0.09, -0.08, 0.036],
          [0.04, -0.09, -0.08, 0.036],
          [-0.06, -0.1, -0.1, 0.034],
          [0.06, -0.1, -0.1, 0.034],
        ] as const
      ).map(([a, b, c, d], i) => (
        <mesh key={i} position={[a, b, c + Z0]} material={mat} castShadow receiveShadow>
          <sphereGeometry args={[d, 14, 12]} />
        </mesh>
      ))}
    </group>
  )
}

export function HairRig({ style, mat }: { style: HairStyle; mat: M }) {
  return (
    <group position={[0, Y, 0.012]}>
      {style === 'buzz' && <HairBuzz mat={mat} />}
      {(style === 'short' ||
        style === 'sidepart' ||
        style === 'undercut' ||
        style === 'mohawk' ||
        style === 'faded') && <HairShort mat={mat} />}
      {style === 'wavy' && <HairWavy mat={mat} />}
      {(style === 'long' || style === 'ponytail') && <HairLong mat={mat} />}
      {(style === 'curly' || style === 'afro') && <HairCurly mat={mat} />}
    </group>
  )
}

/* Barbe : z ~0,10–0,14 relatif à l’origine tête (aligné mâchoire / menton). */

function BeardLight({ mat }: { mat: M }) {
  return (
    <group>
      <RoundedBox
        args={[0.095, 0.02, 0.032]}
        radius={0.01}
        smoothness={2}
        position={[0, 0.01, 0.18]}
        rotation={[0.1, 0, 0]}
        castShadow
        receiveShadow
        material={mat}
      />
      <mesh position={[-0.04, -0.02, 0.16]} rotation={[0.15, -0.15, 0.15]} material={mat} castShadow receiveShadow>
        <capsuleGeometry args={[0.02, 0.055, 4, 6]} />
      </mesh>
      <mesh position={[0.04, -0.02, 0.16]} rotation={[0.15, 0.15, -0.15]} material={mat} castShadow receiveShadow>
        <capsuleGeometry args={[0.02, 0.055, 4, 6]} />
      </mesh>
      <mesh position={[0, -0.065, 0.16]} material={mat} castShadow receiveShadow>
        <sphereGeometry args={[0.05, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
      </mesh>
    </group>
  )
}

/* Barbe fournie : moustache + mâchoire en blocs arrondis + panache menton (pas 6 morceaux identiques). */
function BeardFull({ mat }: { mat: M }) {
  return (
    <group>
      <RoundedBox
        args={[0.115, 0.038, 0.04]}
        radius={0.014}
        smoothness={2}
        position={[0, 0, 0.18]}
        rotation={[0.1, 0, 0]}
        castShadow
        receiveShadow
        material={mat}
      />
      <RoundedBox
        args={[0.055, 0.1, 0.055]}
        radius={0.02}
        smoothness={2}
        position={[-0.05, -0.06, 0.15]}
        rotation={[0, 0, 0.18]}
        castShadow
        receiveShadow
        material={mat}
      />
      <RoundedBox
        args={[0.055, 0.1, 0.055]}
        radius={0.02}
        smoothness={2}
        position={[0.05, -0.06, 0.15]}
        rotation={[0, 0, -0.18]}
        castShadow
        receiveShadow
        material={mat}
      />
      <mesh
        position={[0, -0.1, 0.16]}
        material={mat}
        castShadow
        receiveShadow
        rotation={[0.1, 0, 0]}
      >
        <capsuleGeometry args={[0.085, 0.12, 8, 10]} />
      </mesh>
      <mesh
        position={[0, -0.05, 0.17]}
        material={mat}
        castShadow
        receiveShadow
        rotation={[0.2, 0, 0]}
      >
        <cylinderGeometry args={[0.045, 0.055, 0.04, 12, 1, true, 0, Math.PI]} />
      </mesh>
    </group>
  )
}

function BeardGoatee({ mat }: { mat: M }) {
  return (
    <group>
      <mesh
        position={[0, 0.01, 0.175]}
        rotation={[-0.1, 0, 0]}
        material={mat}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.02, 0.02, 0.04, 12, 1, true, 0, Math.PI]} />
      </mesh>
      <mesh
        position={[0, -0.095, 0.16]}
        material={mat}
        castShadow
        receiveShadow
        rotation={[-0.1, 0, 0]}
      >
        <capsuleGeometry args={[0.03, 0.072, 6, 8]} />
      </mesh>
      <mesh
        position={[0, -0.04, 0.168]}
        material={mat}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[0.022, 10, 8]} />
      </mesh>
    </group>
  )
}

function BeardMoustacheOnly({ mat }: { mat: M }) {
  return (
    <mesh position={[0, 0.02, 0.175]} rotation={[0.12, 0, 0]} material={mat} castShadow receiveShadow>
      <capsuleGeometry args={[0.055, 0.014, 6, 8]} />
    </mesh>
  )
}

export function BeardRig({ variant, mat }: { variant: Beard; mat: M }) {
  if (variant === 'none') return null
  return (
    <group position={[0, Y, 0.04]}>
      {variant === 'light' && <BeardLight mat={mat} />}
      {variant === 'stubble' && (
        <group scale={0.88}>
          <BeardLight mat={mat} />
        </group>
      )}
      {variant === 'full' && <BeardFull mat={mat} />}
      {variant === 'goatee' && <BeardGoatee mat={mat} />}
      {variant === 'vanDyke' && (
        <group>
          <BeardMoustacheOnly mat={mat} />
          <BeardGoatee mat={mat} />
        </group>
      )}
      {variant === 'moustache' && <BeardMoustacheOnly mat={mat} />}
    </group>
  )
}
