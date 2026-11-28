import { SHARE_STORY_HEIGHT, SHARE_STORY_WIDTH } from './renderPronoShareCard'
import { formatScorersLine, type MatchRecapModel } from './matchRecap'
import { APP_ONELINK_URL } from '../config/appStores'

export async function renderMatchRecapStory(model: MatchRecapModel): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = SHARE_STORY_WIDTH
  canvas.height = SHARE_STORY_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  const { match, scorers, bestBettorName, topMessages, correctPronos } = model
  const h = match.score?.home ?? 0
  const a = match.score?.away ?? 0

  ctx.fillStyle = '#071a32'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#e11d2e'
  ctx.fillRect(0, 0, canvas.width, 18)

  ctx.fillStyle = '#8fb4d6'
  ctx.font = '800 36px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('TALK FOOT · RÉCAP', canvas.width / 2, 120)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 48px system-ui, sans-serif'
  ctx.fillText(match.competition.shortName.toUpperCase(), canvas.width / 2, 200)

  ctx.font = '900 56px system-ui, sans-serif'
  ctx.fillText(`${match.home.shortName}  ${h} – ${a}  ${match.away.shortName}`, canvas.width / 2, 340)

  const scorersLine = formatScorersLine(scorers)
  ctx.fillStyle = '#8fb4d6'
  ctx.font = '700 32px system-ui, sans-serif'
  if (scorersLine) ctx.fillText(scorersLine.slice(0, 42), canvas.width / 2, 420)

  let y = 540
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 34px system-ui, sans-serif'
  ctx.textAlign = 'left'
  if (bestBettorName) {
    ctx.fillText(`Meilleur pronostiqueur : ${bestBettorName}`, 80, y)
    y += 70
  }
  if (correctPronos > 0) {
    ctx.fillText(`${correctPronos} pronos justes`, 80, y)
    y += 90
  }
  ctx.fillStyle = '#8fb4d6'
  ctx.font = '800 28px system-ui, sans-serif'
  ctx.fillText('Messages les plus likés', 80, y)
  y += 60
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 30px system-ui, sans-serif'
  for (const msg of topMessages.slice(0, 3)) {
    const line = `@${msg.username} · ${msg.text}`.slice(0, 44)
    ctx.fillText(line, 80, y)
    y += 70
  }

  ctx.fillStyle = '#e11d2e'
  ctx.fillRect(80, canvas.height - 220, canvas.width - 160, 90)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 32px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Télécharge Talk Foot', canvas.width / 2, canvas.height - 162)
  ctx.fillStyle = '#8fb4d6'
  ctx.font = '700 26px system-ui, sans-serif'
  ctx.fillText(APP_ONELINK_URL.replace(/^https?:\/\//, ''), canvas.width / 2, canvas.height - 80)

  return await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/png')
  })
}
