import * as THREE from 'three'

const col = (hex: string) => new THREE.Color(hex)

/** Peau stylisée : légère sheen, micro-variation, pas de plastique, réponse soft. */
export function createSkinMaterial(hex: string) {
  return new THREE.MeshPhysicalMaterial({
    color: col(hex),
    roughness: 0.45,
    metalness: 0.02,
    clearcoat: 0.1,
    clearcoatRoughness: 0.35,
    sheen: 0.45,
    sheenRoughness: 0.5,
    sheenColor: col(mixHex(hex, '#ffefe8', 0.35)),
    envMapIntensity: 0.88,
    ior: 1.4,
  })
}

/**
 * Visage (sphère principale) : micro-variation de teinte, moins d’environnement « plat ».
 */
export function createFaceSkinMaterial(hex: string) {
  return new THREE.MeshPhysicalMaterial({
    color: col(mixHex(hex, '#f0e8e4', 0.06)),
    roughness: 0.48,
    metalness: 0.02,
    clearcoat: 0.08,
    clearcoatRoughness: 0.4,
    sheen: 0.38,
    sheenRoughness: 0.52,
    sheenColor: col(mixHex(hex, '#ffe8e0', 0.12)),
    envMapIntensity: 0.8,
    ior: 1.38,
  })
}

export function createCheekBlushMaterial(skinHex: string) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(mixHex(skinHex, '#f0a0a0', 0.22)),
    roughness: 0.5,
    metalness: 0.02,
    envMapIntensity: 0.55,
    flatShading: false,
  })
}

/** Tissu maillot / short — sRGB propre, moins de luisé HDRI (effet “couleur qui clignote” au mouvement). */
export function createFabricMaterial(hex: string, rough: number) {
  const base = new THREE.Color().setStyle(hex)
  return new THREE.MeshPhysicalMaterial({
    color: base,
    roughness: Math.min(rough + 0.05, 0.9),
    metalness: 0.03,
    clearcoat: 0.05,
    clearcoatRoughness: 0.52,
    sheen: 0.2,
    sheenColor: new THREE.Color(mixHex(hex, '#ffffff', 0.12)),
    sheenRoughness: 0.62,
    envMapIntensity: 0.55,
  })
}

/** Lunettes, plastique légèrement laqué */
export function createGlassesFrameMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: col('#1a2030'),
    metalness: 0.1,
    roughness: 0.35,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
    envMapIntensity: 0.9,
  })
}

export function createGlassesLensMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: col('#d8e2f0'),
    metalness: 0.2,
    roughness: 0.08,
    transparent: true,
    opacity: 0.4,
    transmission: 0.4,
    thickness: 0.1,
    ior: 1.5,
    envMapIntensity: 0.6,
  })
}

/** Sclérotique : volume blanc, réponse HDRI, gloss léger. */
export function createScleraMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f4f6fb'),
    roughness: 0.32,
    metalness: 0.02,
    sheen: 0.18,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color('#ffffff'),
    clearcoat: 0.38,
    clearcoatRoughness: 0.18,
    envMapIntensity: 0.72,
    ior: 1.4,
  })
}

/** @deprecated Utiliser `createScleraMaterial` */
export const createEyeWhiteMaterial = createScleraMaterial

export function createIrisMaterial(hex: string) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setStyle(hex),
    roughness: 0.22,
    metalness: 0.1,
    clearcoat: 0.55,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.8,
  })
}

export function createPupilMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#060608'),
    roughness: 0.78,
    metalness: 0.08,
    clearcoat: 0.2,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.35,
  })
}

/**
 * Petit reflet (catchlight) : pas de texture, highlight géométrique, lisible sous la lumière.
 */
export function createCorneaGlintMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: 0.35,
    roughness: 0.1,
    metalness: 0.05,
    clearcoat: 0.8,
    clearcoatRoughness: 0.05,
    envMapIntensity: 0.9,
  })
}

/** Cernes / creux péri-oculaire (teinte légère, opaque — pas d’artefact de transparence). */
export function createPeriocularShadeMaterial(skinHex: string) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(mixHex(skinHex, '#2a1f24', 0.55)),
    roughness: 0.68,
    metalness: 0.02,
    envMapIntensity: 0.35,
    side: THREE.FrontSide,
    flatShading: false,
  })
}

/** Peau de paupière, léger offset profondeur pour éviter le z-fight avec l’œil. */
export function createEyelidFleshMaterial(skinHex: string) {
  const c = new THREE.Color().setStyle(skinHex)
  c.lerp(new THREE.Color('#0a0a0c'), 0.08)
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.52,
    metalness: 0.02,
    envMapIntensity: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: 0.3,
    polygonOffsetUnits: 0.3,
  })
}

/** Lèvres : un peu plus brillantes / rosées que la peau, sans exagération cartoon. */
export function createLipMaterial(skinHex: string) {
  const c = new THREE.Color().setStyle(skinHex)
  c.lerp(new THREE.Color('#b86878'), 0.42)
  return new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: 0.38,
    metalness: 0.04,
    clearcoat: 0.22,
    clearcoatRoughness: 0.3,
    sheen: 0.28,
    sheenRoughness: 0.45,
    sheenColor: c.clone().lerp(new THREE.Color('#ffe4ea'), 0.35),
    envMapIntensity: 0.6,
  })
}

function mixHex(a: string, b: string, t: number) {
  const c1 = new THREE.Color(a)
  return `#${c1.lerp(new THREE.Color(b), t).getHexString()}`
}
