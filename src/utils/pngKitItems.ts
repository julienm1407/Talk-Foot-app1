/** Shorts rendus en PNG (pas le short SVG « kit » du mannequin). */
export function usesPngShorts(pantsItemId: string): boolean {
  return (
    pantsItemId === 'pants-kit' ||
    pantsItemId.startsWith('pants-base-') ||
    pantsItemId.startsWith('cdm2026-short-')
  )
}
