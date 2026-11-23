export const SHARE_STORY_WIDTH = 1080
export const SHARE_STORY_HEIGHT = 1920

const NAVY = '#061222'
const NAVY_MID = '#0a1f35'
const RED = '#ff3b3b'
const WHITE = '#ffffff'
const MUTED = '#9ec5e8'

export type ShareStoryCardInput = {
  kind: 'prono' | 'tribune'
  matchTitle: string
  whenLabel: string
  headline: string
  subline?: string
  quote?: string | null
  displayName: string
  avatarUrl?: string | null
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

function roundRect(
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

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  name: string,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  if (img) {
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2)
  } else {
    ctx.fillStyle = RED
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = WHITE
    ctx.font = '700 54px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((name.trim()[0] || 'T').toUpperCase(), cx, cy + 4)
  }
  ctx.restore()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = RED
  ctx.lineWidth = 8
  ctx.stroke()
}

export async function renderShareStoryPng(input: ShareStoryCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = SHARE_STORY_WIDTH
  canvas.height = SHARE_STORY_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')

  const g = ctx.createLinearGradient(0, 0, 0, SHARE_STORY_HEIGHT)
  g.addColorStop(0, NAVY_MID)
  g.addColorStop(1, NAVY)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SHARE_STORY_WIDTH, SHARE_STORY_HEIGHT)

  ctx.fillStyle = RED
  ctx.fillRect(0, 0, SHARE_STORY_WIDTH, 18)
  ctx.fillRect(0, SHARE_STORY_HEIGHT - 18, SHARE_STORY_WIDTH, 18)

  const logoBox = 168
  ctx.fillStyle = WHITE
  roundRect(ctx, 80, 72, logoBox, logoBox, 28)
  ctx.fill()
  ctx.fillStyle = RED
  ctx.font = '900 72px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TF', 80 + logoBox / 2, 72 + logoBox / 2 + 4)

  ctx.fillStyle = WHITE
  ctx.font = '900 44px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('TALK FOOT', 280, 140)
  ctx.fillStyle = MUTED
  ctx.font = '700 28px system-ui, sans-serif'
  ctx.fillText(input.kind === 'prono' ? 'Mon prono' : 'J’étais en tribune', 280, 188)

  ctx.fillStyle = WHITE
  ctx.font = '900 64px system-ui, sans-serif'
  const titleLines = wrapLines(ctx, input.matchTitle, 920, 3)
  let y = 320
  for (const line of titleLines) {
    ctx.fillText(line, 80, y)
    y += 78
  }

  ctx.fillStyle = MUTED
  ctx.font = '700 36px system-ui, sans-serif'
  ctx.fillText(input.whenLabel, 80, y + 12)

  roundRect(ctx, 80, y + 60, 920, input.quote ? 420 : 280, 36)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fill()
  ctx.strokeStyle = RED
  ctx.lineWidth = 6
  ctx.stroke()

  ctx.fillStyle = WHITE
  ctx.font = '800 52px system-ui, sans-serif'
  const headLines = wrapLines(ctx, input.headline, 840, 3)
  let hy = y + 140
  for (const line of headLines) {
    ctx.fillText(line, 120, hy)
    hy += 64
  }
  if (input.subline) {
    ctx.fillStyle = input.subline.includes('Gagné') ? '#86efac' : input.subline.includes('Perdu') ? '#fda4af' : MUTED
    ctx.font = '700 36px system-ui, sans-serif'
    ctx.fillText(input.subline, 120, hy + 8)
    hy += 56
  }
  if (input.quote) {
    ctx.fillStyle = MUTED
    ctx.font = 'italic 700 32px system-ui, sans-serif'
    const qLines = wrapLines(ctx, `« ${input.quote} »`, 840, 3)
    for (const line of qLines) {
      ctx.fillText(line, 120, hy + 20)
      hy += 42
    }
  }

  drawAvatar(ctx, null, input.displayName, 160, 1320, 72)
  ctx.fillStyle = WHITE
  ctx.font = '800 40px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(input.displayName, 260, 1310)
  ctx.fillStyle = MUTED
  ctx.font = '700 28px system-ui, sans-serif'
  ctx.fillText('sur Talk Foot', 260, 1358)

  ctx.fillStyle = RED
  roundRect(ctx, 80, 1480, 920, 160, 32)
  ctx.fill()
  ctx.fillStyle = WHITE
  ctx.font = '900 40px system-ui, sans-serif'
  const ctaLines = wrapLines(ctx, input.cta, 840, 2)
  ctx.textAlign = 'center'
  ctx.fillText(ctaLines[0] ?? input.cta, SHARE_STORY_WIDTH / 2, 1550)
  if (ctaLines[1]) ctx.fillText(ctaLines[1], SHARE_STORY_WIDTH / 2, 1600)

  ctx.fillStyle = MUTED
  ctx.font = '600 26px system-ui, sans-serif'
  ctx.fillText(input.shareUrl.replace(/^https?:\/\//, ''), SHARE_STORY_WIDTH / 2, 1760)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png')
  })
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

export function canShareStoryFiles(file: File): boolean {
  const nav = shareNavigator()
  try {
    return Boolean(hasShare() && typeof nav.canShare === 'function' && nav.canShare({ files: [file] }))
  } catch {
    return false
  }
}

/** À appeler sur un tap (geste utilisateur encore valide). */
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

export function saveStoryImage(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
