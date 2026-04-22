import * as THREE from 'three'

const liftFromPureBlack = (h: string) => {
  if (h.toLowerCase() === '#000' || h.toLowerCase() === '#000000') return '#1a1a1e'
  return h
}

const mix = (c: THREE.Color, toward: string, t: number) => c.clone().lerp(new THREE.Color(toward), t)

/**
 * Cheveux & barbe — MeshPhysical (léger) pour volume et reflets, sans transparence.
 * polygonOffset : évite le z-fight peau / paupières.
 */
export function createPopHairAndFuzzMaterial(hairColorHex: string) {
  const base = new THREE.Color().setStyle(liftFromPureBlack(hairColorHex))
  const c = base.clone()
  c.lerp(new THREE.Color('#f5f0ea'), 0.06)
  return new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: 0.76,
    metalness: 0.02,
    sheen: 0.28,
    sheenRoughness: 0.58,
    sheenColor: mix(base, '#e8e4e0', 0.2),
    envMapIntensity: 0.52,
    ior: 1.3,
    side: THREE.FrontSide,
    flatShading: false,
    depthTest: true,
    depthWrite: true,
    transparent: false,
    alphaTest: 0,
    polygonOffset: true,
    polygonOffsetFactor: 0.5,
    polygonOffsetUnits: 0.5,
  })
}
