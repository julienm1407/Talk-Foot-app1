import { TALKFOOT_LOGO_URL } from '../layout/LogoMark'

export const SHARE_STORY_WIDTH = 1080
export const SHARE_STORY_HEIGHT = 1920

const NAVY = '#071525'
const NAVY_MID = '#0d2744'
const RED = '#e11d2e'
const WHITE = '#ffffff'
const MUTED = '#9ec5e8'

export type ShareStoryCardInput = {
  kind: 'prono' | 'tribune'
  homeName: string
  awayName: string
  homeShort: string
  awayShort: string
  homeColor: string
  awayColor: string
  homeLogoUrl?: string | null
  awayLogoUrl?: string | null
  competition: string
  whenLabel: string
  marketLabel: string
  hero: string
  detail?: string
  oddsLabel?: string
  quote?: string | null
  displayName: string
  shareUrl: string
  cta: string
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (ctx.measureText(next).width <= maxWidth) {
      cur = next
    } else {
      if (cur) lines.push(cur)
      cur = w
      if (lines.length >= maxLines - 1) break
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur)
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    let last = lines[maxLines - 1] ?? ''
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1)
    lines[maxLines - 1] = `${last}…`
  }
  return lines
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function fillRound(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  roundRectPath(ctx, x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
}

function loadImage(src: string, timeoutMs: number, cors: boolean): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    let done = false
    const finish = (value: HTMLImageElement | null) => {
      if (done) return
      done = true
      resolve(value)
    }
    const t = window.setTimeout(() => finish(null), timeoutMs)
    if (cors) img.crossOrigin = 'anonymous'
    img.onload = () => {
      window.clearTimeout(t)
      finish(img)
    }
    img.onerror = () => {
      window.clearTimeout(t)
      finish(null)
    }
    img.src = src
  })
}

function isSameOrigin(src: string): boolean {
  try {
    if (src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) return true
    return new URL(src, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

async function safeLogo(src: string | null | undefined): Promise<HTMLImageElement | null> {
  const u = src?.trim()
  if (!u) return null
  const same = isSameOrigin(u)
  const img = await loadImage(u, same ? 1200 : 800, !same)
  return img
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  size: number,
): void {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) return
  const scale = Math.min(size / iw, size / ih)
  const dw = iw * scale
  const dh = ih * scale
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh)
}

function drawCrest(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  color: string,
  label: string,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = WHITE
  ctx.fill()
  ctx.lineWidth = 8
  ctx.strokeStyle = color || RED
  ctx.stroke()
  if (img) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r - 14, 0, Math.PI * 2)
    ctx.clip()
    drawContainedImage(ctx, img, cx, cy, (r - 18) * 2)
    ctx.restore()
    return
  }
  ctx.fillStyle = color || RED
  ctx.beginPath()
  ctx.arc(cx, cy, r - 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = WHITE
  ctx.font = '800 54px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText((label.trim().slice(0, 3) || '?').toUpperCase(), cx, cy + 2)
}

export async function renderShareStoryPng(input: ShareStoryCardInput): Promise<Blob> {
  const [brandLogo, homeLogo, awayLogo] = await Promise.all([
    loadImage(TALKFOOT_LOGO_URL, 1200, false),
    safeLogo(input.homeLogoUrl),
    safeLogo(input.awayLogoUrl),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = SHARE_STORY_WIDTH
  canvas.height = SHARE_STORY_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')

  const bg = ctx.createLinearGradient(0, 0, 0, SHARE_STORY_HEIGHT)
  bg.addColorStop(0, NAVY_MID)
  bg.addColorStop(1, NAVY)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, SHARE_STORY_WIDTH, SHARE_STORY_HEIGHT)

  ctx.fillStyle = RED
  ctx.fillRect(0, 0, SHARE_STORY_WIDTH, 22)
  ctx.fillRect(0, SHARE_STORY_HEIGHT - 22, SHARE_STORY_WIDTH, 22)
  ctx.fillRect(0, 0, 18, SHARE_STORY_HEIGHT)
  ctx.fillRect(SHARE_STORY_WIDTH - 18, 0, 18, SHARE_STORY_HEIGHT)

  fillRound(ctx, 64, 70, 168, 168, 28, WHITE)
  if (brandLogo) {
    drawContainedImage(ctx, brandLogo, 148, 154, 148)
  } else {
    ctx.fillStyle = RED
    ctx.font = '900 64px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('TF', 148, 158)
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = WHITE
  ctx.font = '900 52px system-ui, sans-serif'
  ctx.fillText('TALK FOOT', 260, 138)
  fillRound(ctx, 260, 158, input.kind === 'prono' ? 220 : 280, 44, 22, RED)
  ctx.fillStyle = WHITE
  ctx.font = '800 22px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(input.kind === 'prono' ? 'MON PRONO' : 'EN TRIBUNE', input.kind === 'prono' ? 370 : 400, 180)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = MUTED
  ctx.font = '800 28px system-ui, sans-serif'
  ctx.fillText(input.competition.toUpperCase(), 72, 290)
  ctx.fillStyle = WHITE
  ctx.font = '700 30px system-ui, sans-serif'
  ctx.fillText(input.whenLabel, 72, 336)

  drawCrest(ctx, homeLogo, input.homeColor, input.homeShort, 300, 520, 128)
  drawCrest(ctx, awayLogo, input.awayColor, input.awayShort, 780, 520, 128)
  ctx.fillStyle = MUTED
  ctx.font = '900 36px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('VS', 540, 530)

  ctx.fillStyle = WHITE
  ctx.font = '800 34px system-ui, sans-serif'
  ctx.fillText(input.homeShort, 300, 690)
  ctx.fillText(input.awayShort, 780, 690)
  ctx.fillStyle = MUTED
  ctx.font = '700 24px system-ui, sans-serif'
  const homeFull = wrapLines(ctx, input.homeName, 300, 2)
  const awayFull = wrapLines(ctx, input.awayName, 300, 2)
  ctx.fillText(homeFull[0] ?? '', 300, 728)
  ctx.fillText(awayFull[0] ?? '', 780, 728)

  fillRound(ctx, 64, 790, 952, 430, 36, 'rgba(255,255,255,0.08)')
  roundRectPath(ctx, 64, 790, 952, 430, 36)
  ctx.strokeStyle = RED
  ctx.lineWidth = 5
  ctx.stroke()

  fillRound(ctx, 100, 824, Math.min(420, 28 + input.marketLabel.length * 18), 48, 24, RED)
  ctx.fillStyle = WHITE
  ctx.font = '800 24px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(input.marketLabel.toUpperCase(), 122, 848)

  ctx.textBaseline = 'alphabetic'
  ctx.font = '900 72px system-ui, sans-serif'
  const heroLines = wrapLines(ctx, input.hero, 860, 3)
  let hy = 940
  for (const line of heroLines) {
    ctx.fillText(line, 100, hy)
    hy += 82
  }
  if (input.detail) {
    ctx.fillStyle = MUTED
    ctx.font = '700 32px system-ui, sans-serif'
    ctx.fillText(input.detail, 100, hy + 8)
    hy += 48
  }
  if (input.oddsLabel) {
    ctx.fillStyle = '#fde68a'
    ctx.font = '800 32px system-ui, sans-serif'
    ctx.fillText(input.oddsLabel, 100, hy + 16)
    hy += 44
  }
  if (input.quote) {
    ctx.fillStyle = MUTED
    ctx.font = 'italic 700 28px system-ui, sans-serif'
    const qLines = wrapLines(ctx, `« ${input.quote} »`, 860, 2)
    for (const line of qLines) {
      ctx.fillText(line, 100, hy + 20)
      hy += 36
    }
  }

  ctx.beginPath()
  ctx.arc(120, 1328, 48, 0, Math.PI * 2)
  ctx.fillStyle = RED
  ctx.fill()
  ctx.fillStyle = WHITE
  ctx.font = '800 40px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText((input.displayName.trim()[0] || 'T').toUpperCase(), 120, 1330)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = WHITE
  ctx.font = '800 36px system-ui, sans-serif'
  ctx.fillText(input.displayName, 188, 1320)
  ctx.fillStyle = MUTED
  ctx.font = '700 26px system-ui, sans-serif'
  ctx.fillText('sur Talk Foot', 188, 1360)

  fillRound(ctx, 64, 1440, 952, 150, 28, RED)
  ctx.fillStyle = WHITE
  ctx.font = '900 36px system-ui, sans-serif'
  ctx.textAlign = 'center'
  const ctaLines = wrapLines(ctx, input.cta, 860, 2)
  ctx.fillText(ctaLines[0] ?? input.cta, SHARE_STORY_WIDTH / 2, 1504)
  if (ctaLines[1]) ctx.fillText(ctaLines[1], SHARE_STORY_WIDTH / 2, 1550)

  ctx.fillStyle = MUTED
  ctx.font = '700 26px system-ui, sans-serif'
  ctx.fillText(input.shareUrl.replace(/^https?:\/\//, ''), SHARE_STORY_WIDTH / 2, 1688)
  ctx.fillStyle = WHITE
  ctx.font = '800 28px system-ui, sans-serif'
  ctx.fillText('talk-foot.com', SHARE_STORY_WIDTH / 2, 1736)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png')
  })
  if (!blob) throw new Error('png')
  return blob
}

function shareNavigator(): Navigator & {
  canShare?: (data: ShareData) => boolean
  share?: (data: ShareData) => Promise<void>
} {
  return navigator
}

function hasShare(): boolean {
  return typeof (navigator as Navigator & { share?: unknown }).share === 'function'
}

export function nativeShareAvailable(): boolean {
  return hasShare()
}

export function canShareStoryFiles(file: File): boolean {
  const nav = shareNavigator()
  try {
    return Boolean(hasShare() && typeof nav.canShare === 'function' && nav.canShare({ files: [file] }))
  } catch {
    return false
  }
}

export async function nativeShareStory(opts: {
  blob: Blob
  title: string
  text: string
  url: string
  fileName: string
}): Promise<'shared' | 'aborted' | 'unavailable'> {
  const file = new File([opts.blob], opts.fileName, { type: 'image/png' })
  const nav = shareNavigator()
  if (!hasShare() || !nav.share) return 'unavailable'
  try {
    if (canShareStoryFiles(file)) {
      await nav.share({ files: [file], title: opts.title, text: opts.text, url: opts.url })
      return 'shared'
    }
    await nav.share({ title: opts.title, text: `${opts.text}\n${opts.url}`, url: opts.url })
    return 'shared'
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name === 'AbortError') return 'aborted'
    return 'unavailable'
  }
}

type SavePickerWindow = Window & {
  showSaveFilePicker?: (opts: {
    suggestedName: string
    types: Array<{ description: string; accept: Record<string, string[]> }>
  }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }>
  navigator: Navigator & { msSaveOrOpenBlob?: (blob: Blob, name: string) => void }
}

export async function saveStoryImage(blob: Blob, fileName: string): Promise<'saved' | 'opened' | 'cancelled'> {
  const w = window as SavePickerWindow
  if (typeof w.showSaveFilePicker === 'function') {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'Image PNG', accept: { 'image/png': ['.png'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return 'saved'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
    }
  }
  if (typeof w.navigator.msSaveOrOpenBlob === 'function') {
    w.navigator.msSaveOrOpenBlob(blob, fileName)
    return 'saved'
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return 'saved'
}

export function openStoryImageTab(blobUrl: string): boolean {
  const opened = window.open(blobUrl, '_blank', 'noopener')
  return Boolean(opened)
}
