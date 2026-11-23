import { TALKFOOT_LOGO_URL } from '../layout/LogoMark'
import { MIN_COMMUNITY_VOTES, votePercents, type PronoSharePayload } from './pronoSharePayload'
import { loadQrCodeImage } from './qrCodeImage'

export const SHARE_STORY_WIDTH = 1080
export const SHARE_STORY_HEIGHT = 1920
export const SHARE_OG_WIDTH = 1200
export const SHARE_OG_HEIGHT = 630

const NAVY = '#071a32'
const RED = '#ff3b3b'
const GREEN = '#00b894'
const WHITE = '#ffffff'
const MUTED = '#8fb4d6'
const CTA = '#e11d2e'

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
  return loadImage(u, same ? 1200 : 800, !same)
}

function drawContained(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, size: number) {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) return
  const scale = Math.min(size / iw, size / ih)
  ctx.drawImage(img, cx - (iw * scale) / 2, cy - (ih * scale) / 2, iw * scale, ih * scale)
}

async function waitFonts() {
  try {
    await document.fonts.load('400 160px "Bebas Neue"')
    await document.fonts.load('800 32px Manrope')
    await document.fonts.ready
  } catch {
    /* ignore */
  }
}

function drawStripes(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.045)'
  ctx.lineWidth = 18
  for (let x = -h; x < w + h; x += 46) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + h, h)
    ctx.stroke()
  }
  ctx.restore()
}

function drawSplitCrest(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  color: string,
  second: string,
  label: string,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = WHITE
  ctx.fill()
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2)
  ctx.clip()
  if (img) {
    ctx.fillStyle = WHITE
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    drawContained(ctx, img, cx, cy, (r - 10) * 2)
  } else {
    ctx.fillStyle = color || '#1d4ed8'
    ctx.fillRect(cx - r, cy - r, r, r * 2)
    ctx.fillStyle = second || RED
    ctx.fillRect(cx, cy - r, r, r * 2)
    ctx.fillStyle = WHITE
    ctx.font = '800 42px Manrope, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((label.trim().slice(0, 3) || '?').toUpperCase(), cx, cy + 2)
  }
  ctx.restore()
}

function drawStorePills(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const w = 360
  const h = 64
  fillRound(ctx, x, y, w, h, 12, '#111')
  ctx.fillStyle = WHITE
  ctx.textAlign = 'left'
  ctx.font = '700 18px Manrope, system-ui, sans-serif'
  ctx.fillText('Télécharger dans', x + 56, y + 24)
  ctx.font = '800 22px Manrope, system-ui, sans-serif'
  ctx.fillText('l’App Store', x + 56, y + 48)
  ctx.beginPath()
  ctx.arc(x + 28, y + 32, 10, 0, Math.PI * 2)
  ctx.strokeStyle = WHITE
  ctx.lineWidth = 2
  ctx.stroke()

  fillRound(ctx, x, y + 80, w, h, 12, '#111')
  ctx.fillStyle = WHITE
  ctx.font = '700 18px Manrope, system-ui, sans-serif'
  ctx.fillText('Disponible sur', x + 56, y + 104)
  ctx.font = '800 22px Manrope, system-ui, sans-serif'
  ctx.fillText('Google Play', x + 56, y + 128)
}

function drawQrWithLogo(
  ctx: CanvasRenderingContext2D,
  qr: HTMLImageElement | null,
  logo: HTMLImageElement | null,
  x: number,
  y: number,
  size: number,
) {
  fillRound(ctx, x - 10, y - 10, size + 20, size + 20, 18, WHITE)
  if (qr) {
    ctx.drawImage(qr, x, y, size, size)
  } else {
    ctx.fillStyle = '#111'
    ctx.font = '700 22px Manrope, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('talk-foot.com', x + size / 2, y + size / 2)
  }
  const hole = Math.round(size * 0.28)
  fillRound(ctx, x + (size - hole) / 2, y + (size - hole) / 2, hole, hole, 10, WHITE)
  if (logo) {
    drawContained(ctx, logo, x + size / 2, y + size / 2, hole - 8)
  }
}

function ctaCopy(payload: PronoSharePayload): { title: string; sub: string } {
  if (payload.state === 'won') {
    return {
      title: 'TU FAIS MIEUX ?\nPROUVE-LE.',
      sub: 'Gratuit · pronos entre supporters · tribune\nen direct pendant le match',
    }
  }
  if (payload.state === 'lost') {
    return {
      title: 'REVANCHE ?\nFAIS MIEUX.',
      sub: 'Gratuit · pronos entre supporters · tribune\nen direct pendant le match',
    }
  }
  return {
    title: 'T’ES D’ACCORD ?\nFAIS TON PRONO.',
    sub: 'Gratuit · pronos entre supporters · tribune\nen direct pendant le match',
  }
}

function badgeFor(payload: PronoSharePayload): { label: string; color: string } {
  if (payload.state === 'won') return { label: 'PRONO GAGNÉ', color: GREEN }
  if (payload.state === 'lost') return { label: 'REVANCHE ?', color: '#334155' }
  return { label: 'MON PRONO', color: RED }
}

export type RenderedShareCards = {
  story: Blob
  og: Blob
}

export async function renderPronoShareCards(payload: PronoSharePayload, shareUrl: string): Promise<RenderedShareCards> {
  await waitFonts()
  const [brand, homeLogo, awayLogo, qr] = await Promise.all([
    loadImage(TALKFOOT_LOGO_URL, 1200, false),
    safeLogo(payload.homeLogoUrl),
    safeLogo(payload.awayLogoUrl),
    loadQrCodeImage(shareUrl, 420),
  ])

  const story = await renderStory(payload, shareUrl, brand, homeLogo, awayLogo, qr)
  const og = await renderOg(payload, shareUrl, brand, homeLogo, awayLogo, qr)
  return { story, og }
}

async function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
  if (!blob) throw new Error('png')
  return blob
}

async function renderStory(
  payload: PronoSharePayload,
  shareUrl: string,
  brand: HTMLImageElement | null,
  homeLogo: HTMLImageElement | null,
  awayLogo: HTMLImageElement | null,
  qr: HTMLImageElement | null,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = SHARE_STORY_WIDTH
  canvas.height = SHARE_STORY_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')

  const bg = ctx.createLinearGradient(0, 0, SHARE_STORY_WIDTH, SHARE_STORY_HEIGHT)
  bg.addColorStop(0, '#0b2a4d')
  bg.addColorStop(0.55, NAVY)
  bg.addColorStop(1, '#3b0d24')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, SHARE_STORY_WIDTH, SHARE_STORY_HEIGHT)
  drawStripes(ctx, SHARE_STORY_WIDTH, SHARE_STORY_HEIGHT)

  fillRound(ctx, 48, 54, 92, 92, 18, WHITE)
  if (brand) drawContained(ctx, brand, 94, 100, 84)
  ctx.fillStyle = WHITE
  ctx.textAlign = 'left'
  ctx.font = '800 42px Manrope, system-ui, sans-serif'
  ctx.fillText('TALK FOOT', 160, 112)

  const badge = badgeFor(payload)
  ctx.font = '800 22px Manrope, sans-serif'
  const bw = Math.max(180, ctx.measureText(badge.label).width + 40)
  fillRound(ctx, SHARE_STORY_WIDTH - 48 - bw, 70, bw, 48, 24, badge.color)
  ctx.fillStyle = WHITE
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(badge.label, SHARE_STORY_WIDTH - 48 - bw / 2, 94)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = MUTED
  ctx.font = '800 26px Manrope, sans-serif'
  ctx.fillText(`${payload.competition.toUpperCase()}  ·  ${payload.when}`, SHARE_STORY_WIDTH / 2, 200)

  drawSplitCrest(ctx, homeLogo, payload.homeColor, payload.homeColor, payload.homeShort, 330, 360, 108)
  drawSplitCrest(ctx, awayLogo, payload.awayColor, RED, payload.awayShort, 750, 360, 108)
  ctx.fillStyle = MUTED
  ctx.font = '800 28px Manrope, sans-serif'
  ctx.fillText('VS', SHARE_STORY_WIDTH / 2, 370)
  ctx.fillStyle = WHITE
  ctx.font = '800 28px Manrope, sans-serif'
  ctx.fillText(payload.homeShort, 330, 500)
  ctx.fillText(payload.awayShort, 750, 500)
  ctx.fillStyle = MUTED
  ctx.font = '700 22px Manrope, sans-serif'
  ctx.fillText(payload.home, 330, 532)
  ctx.fillText(payload.away, 750, 532)

  const initial = (payload.displayName.trim()[0] || 'T').toUpperCase()
  ctx.beginPath()
  ctx.arc(SHARE_STORY_WIDTH / 2 - 200, 610, 28, 0, Math.PI * 2)
  ctx.fillStyle = '#f97316'
  ctx.fill()
  ctx.fillStyle = WHITE
  ctx.font = '800 24px Manrope, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(initial, SHARE_STORY_WIDTH / 2 - 200, 612)
  ctx.fillStyle = MUTED
  ctx.font = '700 26px Manrope, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`${payload.displayName} a fait son prono`, SHARE_STORY_WIDTH / 2 - 160, 614)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = WHITE
  ctx.font = '400 150px "Bebas Neue", Impact, sans-serif'
  ctx.fillText(payload.outcome || 'PRONO', SHARE_STORY_WIDTH / 2, 780)
  if (payload.team) {
    ctx.fillStyle = RED
    ctx.fillText(payload.team.toUpperCase(), SHARE_STORY_WIDTH / 2, 920)
  }

  const oddsBits = [payload.odds, payload.form].filter(Boolean).join('  ·  ')
  if (oddsBits) {
    ctx.fillStyle = MUTED
    ctx.font = 'italic 800 28px Manrope, sans-serif'
    ctx.fillText(oddsBits, SHARE_STORY_WIDTH / 2, 980)
  }

  let y = 1020
  if (payload.state === 'won' && payload.wonScore) {
    fillRound(ctx, 90, y, 900, 64, 32, GREEN)
    ctx.fillStyle = WHITE
    ctx.font = '800 26px Manrope, sans-serif'
    ctx.fillText(`✅  PRONO GAGNANT  ·  ${payload.wonScore}`, SHARE_STORY_WIDTH / 2, y + 42)
    y += 84
  }
  if (payload.state === 'won' && payload.week) {
    fillRound(ctx, 90, y, 900, 150, 28, 'rgba(255,255,255,0.08)')
    ctx.fillStyle = WHITE
    ctx.font = '800 22px Manrope, sans-serif'
    ctx.fillText('Classement de la semaine', SHARE_STORY_WIDTH / 2, y + 40)
    ctx.font = '800 36px Manrope, sans-serif'
    ctx.fillText(
      `#${payload.week.rank}  ·  +${payload.week.tokens} jetons  ·  ${payload.week.pct}% avaient vu juste`,
      SHARE_STORY_WIDTH / 2,
      y + 100,
    )
    y += 170
  } else if (payload.vote && votePercents(payload.vote).total >= MIN_COMMUNITY_VOTES) {
    const p = votePercents(payload.vote)
    fillRound(ctx, 90, y, 900, 200, 28, 'rgba(255,255,255,0.92)')
    ctx.fillStyle = '#0f2744'
    ctx.font = '800 26px Manrope, sans-serif'
    ctx.fillText('Les supporters Talk Foot ont voté', SHARE_STORY_WIDTH / 2, y + 48)
    const barX = 130
    const barW = 820
    const barY = y + 80
    fillRound(ctx, barX, barY, barW, 44, 22, '#e2e8f0')
    const wHome = (p.home / 100) * barW
    const wDraw = (p.draw / 100) * barW
    ctx.fillStyle = '#2563eb'
    fillRound(ctx, barX, barY, Math.max(36, wHome), 44, 22, '#2563eb')
    ctx.fillStyle = '#e11d2e'
    const awayW = Math.max(36, (p.away / 100) * barW)
    fillRound(ctx, barX + barW - awayW, barY, awayW, 44, 22, '#e11d2e')
    ctx.fillStyle = WHITE
    ctx.font = '800 20px Manrope, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${payload.homeShort} ${p.home}%`, barX + 16, barY + 30)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#334155'
    ctx.fillText('Nul', barX + wHome + wDraw / 2, barY + 30)
    ctx.textAlign = 'right'
    ctx.fillStyle = WHITE
    ctx.fillText(`${p.away}%`, barX + barW - 16, barY + 30)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#334155'
    ctx.font = '800 22px Manrope, sans-serif'
    ctx.fillText(`${p.total} pronos · ton avis manque`, SHARE_STORY_WIDTH / 2, y + 168)
    y += 220
  }

  const ctaY = 1360
  fillRound(ctx, 48, ctaY, 984, 500, 36, CTA)
  const copy = ctaCopy(payload)
  ctx.fillStyle = WHITE
  ctx.textAlign = 'left'
  ctx.font = '400 64px "Bebas Neue", Impact, sans-serif'
  const lines = copy.title.split('\n')
  ctx.fillText(lines[0] ?? '', 88, ctaY + 90)
  if (lines[1]) ctx.fillText(lines[1], 88, ctaY + 160)
  ctx.font = '700 24px Manrope, sans-serif'
  const subLines = copy.sub.split('\n')
  ctx.fillText(subLines[0] ?? '', 88, ctaY + 220)
  if (subLines[1]) ctx.fillText(subLines[1], 88, ctaY + 252)
  drawStorePills(ctx, 88, ctaY + 290)
  drawQrWithLogo(ctx, qr, brand, 740, ctaY + 70, 250)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '700 18px Manrope, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(shareUrl.replace(/^https?:\/\//, '').split('?')[0] ?? '', 865, ctaY + 350)

  return canvasToPng(canvas)
}

async function renderOg(
  payload: PronoSharePayload,
  shareUrl: string,
  brand: HTMLImageElement | null,
  homeLogo: HTMLImageElement | null,
  awayLogo: HTMLImageElement | null,
  qr: HTMLImageElement | null,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = SHARE_OG_WIDTH
  canvas.height = SHARE_OG_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.fillStyle = NAVY
  ctx.fillRect(0, 0, SHARE_OG_WIDTH, SHARE_OG_HEIGHT)
  drawStripes(ctx, SHARE_OG_WIDTH, SHARE_OG_HEIGHT)
  fillRound(ctx, 36, 28, 72, 72, 14, WHITE)
  if (brand) drawContained(ctx, brand, 72, 64, 64)
  ctx.fillStyle = WHITE
  ctx.textAlign = 'left'
  ctx.font = '800 32px Manrope, sans-serif'
  ctx.fillText('TALK FOOT', 124, 74)
  const badge = badgeFor(payload)
  fillRound(ctx, 980, 36, 180, 44, 22, badge.color)
  ctx.fillStyle = WHITE
  ctx.textAlign = 'center'
  ctx.font = '800 18px Manrope, sans-serif'
  ctx.fillText(badge.label, 1070, 64)

  drawSplitCrest(ctx, homeLogo, payload.homeColor, payload.homeColor, payload.homeShort, 160, 220, 78)
  drawSplitCrest(ctx, awayLogo, payload.awayColor, RED, payload.awayShort, 360, 220, 78)
  ctx.fillStyle = MUTED
  ctx.font = '800 22px Manrope, sans-serif'
  ctx.fillText('VS', 260, 228)

  ctx.textAlign = 'left'
  ctx.fillStyle = WHITE
  ctx.font = '400 92px "Bebas Neue", Impact, sans-serif'
  ctx.fillText(payload.outcome || 'PRONO', 480, 220)
  ctx.fillStyle = RED
  ctx.fillText((payload.team || payload.homeShort).toUpperCase(), 480, 320)
  ctx.fillStyle = MUTED
  ctx.font = '700 22px Manrope, sans-serif'
  ctx.fillText(`${payload.displayName} · ${payload.competition} · ${payload.when}`, 480, 370)

  fillRound(ctx, 0, 500, SHARE_OG_WIDTH, 130, 0, CTA)
  ctx.fillStyle = WHITE
  ctx.font = '400 42px "Bebas Neue", Impact, sans-serif'
  ctx.fillText(ctaCopy(payload).title.replace('\n', ' '), 40, 560)
  ctx.font = '700 20px Manrope, sans-serif'
  ctx.fillText('talk-foot.com — installe l’appli et fais ton prono', 40, 600)
  drawQrWithLogo(ctx, qr, brand, 1020, 430, 140)
  void shareUrl
  return canvasToPng(canvas)
}

export async function renderShareStoryPng(payload: PronoSharePayload, shareUrl: string): Promise<Blob> {
  const { story } = await renderPronoShareCards(payload, shareUrl)
  return story
}
