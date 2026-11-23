function shareNavigator(): Navigator & {
  canShare?: (data: ShareData) => boolean
  share?: (data: ShareData) => Promise<void>
} {
  return navigator
}

function hasWebShare(): boolean {
  return typeof (navigator as Navigator & { share?: unknown }).share === 'function'
}

function canShareStoryFiles(file: File): boolean {
  const nav = shareNavigator()
  try {
    return Boolean(hasWebShare() && typeof nav.canShare === 'function' && nav.canShare({ files: [file] }))
  } catch {
    return false
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer()
  const u8 = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function shareViaCapacitor(opts: {
  blob: Blob
  title: string
  text: string
  url: string
  fileName: string
}): Promise<'shared' | 'aborted' | 'unavailable'> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return 'unavailable'
    if (!Capacitor.isPluginAvailable('Share') || !Capacitor.isPluginAvailable('Filesystem')) {
      return 'unavailable'
    }
    const { Share } = await import('@capacitor/share')
    const { Directory, Filesystem } = await import('@capacitor/filesystem')
    const path = opts.fileName.replace(/[^\w.-]+/g, '_')
    await Filesystem.writeFile({
      path,
      data: await blobToBase64(opts.blob),
      directory: Directory.Cache,
    })
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache })
    await Share.share({
      title: opts.title,
      text: opts.text.includes(opts.url) ? opts.text : `${opts.text}\n${opts.url}`,
      files: [uri],
      dialogTitle: 'Partager mon prono',
    })
    return 'shared'
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    const message = err instanceof Error ? err.message : ''
    if (name === 'AbortError' || /cancel/i.test(message)) return 'aborted'
    return 'unavailable'
  }
}

export async function nativeShareStory(opts: {
  blob: Blob
  title: string
  text: string
  url: string
  fileName: string
}): Promise<'shared' | 'aborted' | 'unavailable'> {
  const cap = await shareViaCapacitor(opts)
  if (cap !== 'unavailable') return cap

  const file = new File([opts.blob], opts.fileName, { type: 'image/png' })
  const nav = shareNavigator()
  if (!hasWebShare() || !nav.share) return 'unavailable'
  try {
    const text = opts.text.includes(opts.url) ? opts.text : `${opts.text}\n${opts.url}`
    if (canShareStoryFiles(file)) {
      await nav.share({ files: [file], title: opts.title, text })
      return 'shared'
    }
    await nav.share({ title: opts.title, text, url: opts.url })
    return 'shared'
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name === 'AbortError') return 'aborted'
    return 'unavailable'
  }
}
