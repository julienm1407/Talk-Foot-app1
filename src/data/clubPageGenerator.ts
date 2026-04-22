/**
 * Données hub / CV club personnalisées (contexte 2025-2026) — une entrée riche par équipe du catalogue.
 * Déterministe (même id → même contenu) pour cohérence en démo.
 */
import type { Team } from '../types/match'
import type { ClubPageMock, ClubSquadNode, ClubDebateItem, ClubShopItem } from './clubPageMock'
import { ALL_CLUBS_BY_ID } from './allClubsCatalog'
import { competitionThemes } from './competitionThemes'

const ELITE = new Set([
  'psg',
  'rma',
  'fcb',
  'mci',
  'liv',
  'ars',
  'mun',
  'che',
  'tot',
  'bayern',
  'bvb',
  'inter',
  'milan',
  'juve',
  'atleti',
  'om',
  'lyon',
  'monaco',
  'lille',
  'new',
  'napoli',
  'roma',
])

const LARGE = new Set([
  'lens',
  'rennes',
  'nice',
  'brest',
  'nantes',
  'leverkusen',
  'leipzig',
  'frankfurt',
  'sevilla',
  'sociedad',
  'villarreal',
  'betis',
  'bilbao',
  'valencia',
  'avl',
  'whu',
  'bha',
  'palace',
  'fulham',
  'bologna',
  'fiorentina',
  'atalanta',
  'lazio',
  'wolfsburg',
  'bremen',
  'cagliari',
  'genoa',
  'udinese',
])

const COACH_KNOWN: Record<string, string> = {
  psg: 'Luis Enrique',
  om: 'Roberto De Zerbi',
  rma: 'Carlo Ancelotti',
  fcb: 'Hansi Flick',
  mci: 'Pep Guardiola',
  ars: 'Mikel Arteta',
  che: 'Enzo Maresca',
  liv: 'Arne Slot',
  mun: 'Ruben Amorim',
  tot: 'Thomas Frank',
  new: 'Eddie Howe',
  bayern: 'Vincent Kompany',
  bvb: 'Niko Kovač',
  inter: 'Cristian Chivu',
  milan: 'Alessio Dionisi',
  juve: 'Igor Tudor',
  napoli: 'Antonio Conte',
  atleti: 'Diego Simeone',
  roma: 'Maurizio Sarri',
  lyon: 'Paulo Fonseca',
  monaco: 'C. Ranie…',
  lille: 'Bruno Génésio',
  lens: 'F. Haise',
  rennes: 'J. Gourvennec',
  leverkusen: 'Aitor Ruibal',
  leipzig: 'A. Sánchez',
  frankfurt: 'D. Toppmöller',
  sevilla: 'C. Sánchez',
  betis: 'E. Sánchez',
}

const STAD_KNOWN: Record<string, string> = {
  psg: 'Parc des Princes',
  om: 'Stade Vélodrome',
  rma: 'Santiago Bernabéu',
  fcb: 'Lluís Companys (Montjuïc)',
  mci: 'Etihad Stadium',
  ars: 'Emirates',
  che: 'Stamford Bridge',
  liv: 'Anfield',
  mun: 'Old Trafford',
  tot: 'Tottenham Hotspur Stadium',
  bayern: 'Allianz Arena',
  bvb: 'Signal Iduna Park',
  inter: 'San Siro',
  milan: 'San Siro',
  juve: 'Allianz Stadium',
  lille: 'Pierre-Mauroy',
  lyon: 'Groupama Stadium',
  monaco: 'Stade Louis-II',
  lens: 'Bollaert-Delelis',
  rennes: 'Roazhon Park',
}

const FIRST = ['A.', 'K.', 'J.', 'L.', 'M.', 'R.', 'D.', 'T.', 'E.', 'P.', 'S.', 'N.']

const SURN = [
  'Fernandes',
  'Silva',
  'Garcia',
  'Hernández',
  'Silva R.',
  'Baka',
  'Díaz',
  'Cota',
  'Jensen',
  'Bauer',
  'Dubois',
  'Keller',
  'Lombardi',
  'Costa',
  'Moreno',
  'Ivanov',
  'Hansen',
  'Weber',
  'Petrov',
  'Deme',
  'Afolabi',
  'Cissé',
  'Schmidt',
  'Rossi',
  'Bianchi',
]

function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

function leagueShort(leagueId: string): string {
  const t = competitionThemes[leagueId as keyof typeof competitionThemes]
  if (leagueId === 'ligue-1') return 'L1'
  if (leagueId === 'epl') return 'EPL'
  if (leagueId === 'laliga') return 'LAL'
  if (leagueId === 'serie-a') return 'Série A'
  if (leagueId === 'bund') return 'Bundesliga'
  return t?.name?.split(' ')[0] ?? 'L1'
}

function posLabel(i: number): { x: number; y: number; number: string } {
  // 4-3-3 + gardien = 11 titulaires (vue tactique : haut = attaque)
  const pos: { x: number; y: number; number: string }[] = [
    { x: 50, y: 20, number: '9' },
    { x: 24, y: 26, number: '11' },
    { x: 76, y: 26, number: '7' },
    { x: 32, y: 46, number: '8' },
    { x: 50, y: 48, number: '6' },
    { x: 68, y: 46, number: '10' },
    { x: 18, y: 70, number: '3' },
    { x: 40, y: 72, number: '4' },
    { x: 60, y: 72, number: '5' },
    { x: 82, y: 70, number: '2' },
    { x: 50, y: 90, number: '1' },
  ]
  return pos[i] ?? pos[0]
}

function makeSquad(pfx: string, s: number): { squad: ClubSquadNode[]; starIndex: number; hotIndex: number } {
  let seed = s
  const r = (max: number) => {
    seed = (Math.imul(seed, 0x5bd1e995) + 0x3c6ef35f) >>> 0
    return seed % (max + 1)
  }
  const n = 11
  const starIndex = 0
  let hotIndex = 3 + (r(5) % 5)
  if (hotIndex === starIndex) hotIndex = 4

  const squad: ClubSquadNode[] = []
  for (let i = 0; i < n; i++) {
    const p = posLabel(i)
    const f = FIRST[r(FIRST.length - 1)]
    const sur = SURN[r(SURN.length - 1)]
    const id = `${pfx}-p${i + 1}`
    const base = 3.2 + (r(100) / 100) * 1.4
    const rating = i === starIndex ? Math.min(4.9, 4.2 + (r(70) / 100)) : i === hotIndex ? 3.8 + (r(40) / 100) : base
    squad.push({
      id,
      label: `${f} ${sur}`,
      number: p.number,
      x: p.x,
      y: p.y,
      rating: Math.round(rating * 10) / 10,
    })
  }
  return { squad, starIndex, hotIndex }
}

function formStripFromSeed(s: number): { strip: Array<'V' | 'N' | 'D'>; tone: 'hot' | 'mixed' | 'cold' } {
  const out: Array<'V' | 'N' | 'D'> = []
  let t = s
  for (let k = 0; k < 5; k++) {
    t = (Math.imul(t, 0x9e3779b1) + k) >>> 0
    const c = t % 10
    if (c < 4) out.push('V')
    else if (c < 7) out.push('N')
    else out.push('D')
  }
  const wins = out.filter((x) => x === 'V').length
  if (wins >= 3) return { strip: out, tone: 'hot' }
  if (wins <= 1) return { strip: out, tone: 'cold' }
  return { strip: out, tone: 'mixed' }
}

function numFmt(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000
    return (v >= 10 ? v.toFixed(0) : v.toFixed(1).replace('.0', '').replace('.', ',')) + 'M'
  }
  if (n >= 1000) {
    return Math.round(n / 1000) + 'K'
  }
  return String(n)
}

function buildDebates(
  id: string,
  shortName: string,
  _star: string,
  surnStar: string,
  tone: 'hot' | 'mixed' | 'cold',
  seed: number,
): ClubDebateItem[] {
  const t = (key: string) => `tf-d-${id}-${key}`
  const w1 = 35 + (seed % 32)

  const live = seed % 2 === 0
  if (tone === 'hot') {
    return [
      { id: t('1'), title: `Le ${shortName} peut-il jouer le titre en 2025-26 ?`, yesPct: 55 + (seed % 20), comments: 1200 + (seed % 2000), isLive: live },
      { id: t('2'), title: `« ${surnStar} est notre MVP cette saison. » D’accord ?`, yesPct: 40 + (seed % 30), comments: 800 + (seed % 900), isLive: !live },
      { id: t('3'), title: 'Priorité mercato hiver : renforcer l’attaque ?', yesPct: 50 + (seed % 20), comments: 500 + (seed % 400), isLive: false },
    ]
  }
  if (tone === 'cold') {
    return [
      { id: t('1'), title: `Faut-il se séparer de l’entraîneur si la moyenne baisse ?`, yesPct: 35 + (seed % 20), comments: 900 + (seed % 1100), isLive: true },
      { id: t('2'), title: `Le système 4-2-3-1 nous étouffe-t-il en ${shortName} ?`, yesPct: 48 + (seed % 20), comments: 620 + (seed % 200), isLive: false },
      { id: t('3'), title: `Coupable n°1 des résultats : l’attaque, le milieu, ou la charnière ?`, yesPct: 32 + (seed % 20), comments: 1400 + (seed % 800), isLive: false },
    ]
  }
  return [
    { id: t('1'), title: `Playoffs ou maintien serein : plafond de verre ?`, yesPct: w1, comments: 500 + (seed % 500), isLive: live },
    { id: t('2'), title: `4-3-3 ou 4-2-3-1 : quel socle pour le prochain choc de ${shortName} ?`, yesPct: 44, comments: 400 + (seed % 200), isLive: false },
    { id: t('3'), title: `« ${surnStar} a surperformé. » Sous-estimé ou vraie valeur ?`, yesPct: 58 - (seed % 15), comments: 700 + (seed % 400), isLive: !live },
  ]
}

function defaultShop(id: string, shortName: string): ClubShopItem[] {
  return [
    { id: `s1-${id}`, label: 'Skin fumigène (effet)', price: '450', emoji: '🌫️', kind: 'fx' },
    { id: `s2-${id}`, label: `Badges ${shortName} ultras`, price: '200', emoji: '🏅', kind: 'badge' },
    { id: `s3-${id}`, label: 'Maillot style tribune (générique)', price: '1200', emoji: '👕', kind: 'wear' },
    { id: `s4-${id}`, label: 'Halo vocal rétro', price: '320', emoji: '✨', kind: 'skin' },
  ]
}

export function buildClubPageMock(team: Team): ClubPageMock {
  const id = team.id
  const h = fnv1a(id)
  const entry = ALL_CLUBS_BY_ID[id]
  const leagueId = entry?.leagueId ?? 'ligue-1'
  const leagueS = leagueShort(leagueId)

  const isElite = ELITE.has(id) || h % 7 === 0
  const isLarge = !isElite && (LARGE.has(id) || h % 4 === 0)
  const tier: 'E' | 'L' | 'M' = isElite ? 'E' : isLarge ? 'L' : 'M'

  const { squad, starIndex, hotIndex } = makeSquad(id, h)
  const { strip, tone } = formStripFromSeed(fnv1a(`${id}|form`))

  const starLabel = squad[starIndex]!.label
  const surnStar = starLabel.split(' ').pop() ?? 'Star'
  const debates = buildDebates(id, team.shortName, starLabel, surnStar, tone, fnv1a(`${id}|d`))
  const hotId = squad[hotIndex]!.id

  const mMult = tier === 'E' ? 2.0 : tier === 'L' ? 1.2 : 0.5
  const baseFans = 80_000 + (h % 400_000)
  const fansM = baseFans * mMult * (isElite ? 12 : 1.5)
  const msgsD = (1200 + (h % 20_000)) * mMult
  const voiceH = 1200 * mMult + (h % 5_000)
  const growthStr =
    tone === 'cold'
      ? '−' + (1.1 + (h % 5) * 0.2).toFixed(1).replace('.', ',') + ' % (ralentis.)'
      : '+' + (2.2 + (h % 9) * 0.2).toFixed(1).replace('.', ',') + ' % (eq.)'
  const activitySpike = tone === 'hot' ? `+${120 + (h % 200)} % (jours de match)` : tone === 'cold' ? `+${15 + (h % 20)} % (débats en hausse)` : `+${50 + (h % 50)} % en pic`

  const openRooms = tier === 'E' ? 8 + (h % 8) : tier === 'L' ? 3 + (h % 4) : 1 + (h % 2)
  const liveMpm = Math.max(200, Math.round(600 * mMult + (h % 2_200)))

  const rankStr =
    tier === 'E'
      ? `#${1 + (h % 3)} Ligue (activité) Talk Foot — ${leagueS}`
      : tier === 'L'
        ? `#${5 + (h % 6)} (Europe fan)`
        : `#${12 + (h % 18)} niche ${leagueS}`

  const onFire = tone === 'hot' || (tier === 'E' && h % 2 === 0)
  const matchMode = (tier === 'E' && h % 2 === 0) || h % 5 === 0

  const posTable =
    tone === 'hot' && tier === 'E'
      ? `1ʳᵉ / ${leagueS.includes('EPL') ? '20' : '18–20'}`
      : tone === 'cold' && tier === 'M'
        ? `${10 + (h % 5)}ᵉ / 18–20`
        : `${2 + (h % 4)}ᵉ / ${leagueS === 'EPL' ? 20 : 16}`

  const pts = tone === 'hot' ? 48 - (h % 8) : 28 + (h % 10)
  const lineGap =
    tone === 'hot' ? (h % 2 ? 'Derniers résultats : rassurants' : 'Raccourci 1ʳᵉ : −' + (h % 3)) : 'Débats serrés sur l’entraîneur (démo)'

  const heroTag =
    tone === 'hot'
      ? 'En confiance — 25-26'
      : tone === 'cold'
        ? 'Débats d’enfer · mercato'
        : 'Hub vocal & tribunes'
  const popularityLabel =
    tier === 'E'
      ? `${numFmt(fansM)} supporteurs actifs (démo)`
      : `${numFmt(Math.max(2_200, fansM * 0.1))} fans (niche) — ${leagueS}`

  const coach = COACH_KNOWN[id] ?? `Staff technique (25-26) · ${team.shortName}`
  const stadium = STAD_KNOWN[id] ?? `Stade principal · ${entry?.name.split(' ').pop() ?? team.name}`

  const rivals = [
    'rival traditionnel (cal.)',
    'candidat C1',
    'outsider haut de tableau',
    'voisin régional (cal.)',
  ]
  const op = rivals[h % 4]!

  const t1 = 1 + (h % 3) + (tier === 'E' ? 4 : tier === 'L' ? 1 : 0)
  const t2 = 1 + (h % 3)

  const a = `Fan${h % 7}_${id.slice(0, 2).toUpperCase()}`
  const b = `Ultras_${team.shortName}`
  const c = `Kev_${(7 + h % 12)}` + (h % 2 ? 'x' : 'o')

  return {
    heroTag,
    matchMode,
    onFire,
    popularityLabel,
    liveMsgPerMin: `${liveMpm.toLocaleString('fr-FR')} messages / min (pic)`,
    openRooms,
    activitySpike,
    globalRank: rankStr,
    topFan: { name: a, handle: `@${team.id}_hub`, seed: id.slice(0, 1).toUpperCase() },
    hotPlayerId: hotId,
    squad,
    debates,
    shop: defaultShop(id, team.shortName),
    stats: [
      { label: 'Fans (Talk Foot)', value: numFmt(fansM), sub: 'sur 12 mois' },
      { label: 'Messages / jour (eq.)', value: numFmt(msgsD), sub: 'pic match' },
      { label: 'Heures vocal / sem (eq.)', value: numFmt(voiceH) },
      { label: 'Croissance 7j (eq.)', value: growthStr },
    ],
    topFans: [
      { rank: 1, name: a, seed: a.slice(0, 1), pts: (9200 - (h % 400)).toLocaleString('fr-FR') },
      { rank: 2, name: b, seed: 'B', pts: (8400 - (h % 200)).toLocaleString('fr-FR') },
      { rank: 3, name: c, seed: 'C', pts: (7000 - (h % 300)).toLocaleString('fr-FR') },
    ],
    mvpTitle: tone === 'hot' ? 'Fan of the day — tifo validé' : 'Fan of the day — sondage tribune',
    trophies: [
      { label: 'Ligues (illustr.)', count: String(t1 + (tier === 'E' ? 3 : 0)) },
      { label: 'Coupes (illustr.)', count: String(t2) },
    ],
    infoSummary: {
      coach,
      stadium,
      nextOpponent: `vs ${op} · prochaine fenêtre (cal. démo)`,
    },
    upcoming: {
      league: leagueS,
      matchday: `J${8 + (h % 20)}`,
      opponent: h % 2 ? `vs ${op}` : 'dépl. (stade visiteur) — cal. démo',
      kickoff: h % 2 ? 'ven. 21:00' : 'dim. 15:00',
      venue: h % 2 === 0 ? 'ext' : 'dom',
    },
    formStrip: strip,
    tableSnapshot: { position: posTable, points: `${pts} pts (simu)`, line: lineGap },
    shopWallet: {
      balance: (1800 + (h % 6_000)).toLocaleString('fr-FR'),
      owned: String(4 + (h % 18)),
    },
    hubPulse: [
      { label: 'Débats 24h', value: numFmt(800 + h % 1_200), sub: `+${5 + h % 12} %` },
      {
        label: 'Salon vocal',
        value: `${openRooms + 1} ouverts`,
        sub: `pic ${team.shortName}`,
      },
    ],
  }
}
