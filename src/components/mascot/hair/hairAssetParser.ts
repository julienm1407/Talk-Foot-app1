/** Parse les SVG manuels (groupes back / side / top / front) en paths monde. */

export type HairAssetLayerId = 'back' | 'side' | 'top' | 'front'

export type ParsedHairAsset = Record<HairAssetLayerId, string>

const LAYER_IDS: HairAssetLayerId[] = ['back', 'side', 'top', 'front']

function ellipseToPath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 1 ${rx * 2} 0 a ${rx} ${ry} 0 1 1 ${-rx * 2} 0`
}

function shapesToPathD(inner: string): string {
  const paths: string[] = []

  for (const m of inner.matchAll(/<path[^>]*\sd=["']([^"']+)["']/gi)) {
    paths.push(m[1]!)
  }

  for (const m of inner.matchAll(
    /<ellipse[^>]*\bcx=["']([^"']+)["'][^>]*\bcy=["']([^"']+)["'][^>]*\brx=["']([^"']+)["'][^>]*\bry=["']([^"']+)["'][^>]*\/?>/gi,
  )) {
    paths.push(
      ellipseToPath(
        parseFloat(m[1]!),
        parseFloat(m[2]!),
        parseFloat(m[3]!),
        parseFloat(m[4]!),
      ),
    )
  }

  return paths.join(' ').trim()
}

function extractLayer(svg: string, layer: HairAssetLayerId): string {
  const re = new RegExp(`<g[^>]*\\bid=["']${layer}["'][^>]*>([\\s\\S]*?)</g>`, 'i')
  const match = svg.match(re)
  if (!match?.[1]) return ''
  return shapesToPathD(match[1])
}

/** Extrait les 4 calques d'un fichier SVG mascotte (viewBox 0 0 100 140). */
export function parseHairAssetSvg(svg: string): ParsedHairAsset {
  const out = {} as ParsedHairAsset
  for (const id of LAYER_IDS) {
    out[id] = extractLayer(svg, id)
  }
  return out
}
