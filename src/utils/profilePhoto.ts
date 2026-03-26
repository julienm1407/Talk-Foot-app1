const MAX_EDGE = 512
const MAX_DATA_URL_CHARS = 520_000

/**
 * Redimensionne et compresse une image en JPEG (data URL) pour le stockage local.
 */
export async function fileToProfilePhotoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choisis une image (JPG, PNG, WebP…).')
  }
  const bitmap = await createImageBitmap(file)
  try {
    const w0 = bitmap.width
    const h0 = bitmap.height
    const scale = Math.min(1, MAX_EDGE / Math.max(w0, h0))
    const w = Math.max(1, Math.round(w0 * scale))
    const h = Math.max(1, Math.round(h0 * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Impossible de traiter l’image.')
    ctx.drawImage(bitmap, 0, 0, w, h)
    let quality = 0.88
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (dataUrl.length > MAX_DATA_URL_CHARS && quality > 0.4) {
      quality -= 0.08
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }
    if (dataUrl.length > MAX_DATA_URL_CHARS) {
      throw new Error('Image trop lourde même après compression. Essaie une photo plus petite.')
    }
    return dataUrl
  } finally {
    bitmap.close()
  }
}
