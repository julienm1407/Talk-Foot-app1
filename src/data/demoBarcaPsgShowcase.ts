/**
 * Showcase temporaire Barça–PSG (gros match test).
 * Désactiver : `DEMO_BARCA_PSG_SHOWCASE_ENABLED = false` puis rebuild.
 * Compositions : UCL 01/10/2025 (dernière rencontre disponible).
 */
import type { SmMatchLineupBundle, SmStartingXiPlayer } from '../api/sportMonks/extractStartingXisFromSmFixture'
import type { LiveFixtureStatRow } from '../api/sportMonks/extractLiveFixtureStatistics'
import type { Highlight } from './highlights'
import type { LiveMatchChatMessageItem } from '../components/channel/LiveMatchChatMessage'
import type { MatchTribuneZone } from '../types/chat'
import type { Match } from '../types/match'
import { teams } from './teams'

/** Kill-switch : passer à `false` pour retirer le showcase. */
export const DEMO_BARCA_PSG_SHOWCASE_ENABLED = true

export const DEMO_BARCA_PSG_MATCH_ID = 'm-demo-live-fcb-psg'

const fcb = teams.laliga.find((t) => t.id === 'fcb')!
const psg = teams['ligue-1'].find((t) => t.id === 'psg')!

/** KO figé ~30' au chargement du module (session navigateur). */
const SHOWCASE_KICKOFF_MS = Date.now() - 30 * 60_000

function xi(
  label: string,
  number: string,
  formationPosition: number,
): SmStartingXiPlayer {
  return { label, number, formationPosition }
}

function benchP(label: string, number: string): SmStartingXiPlayer {
  return { label, number }
}

/** XI confirmés UCL Barça–PSG (1 oct. 2025) — domicile Barça. */
export const DEMO_BARCA_PSG_LINEUPS: SmMatchLineupBundle = {
  source: 'confirmed',
  formations: { home: '4-2-3-1', away: '4-3-3' },
  starters: {
    home: [
      xi('Wojciech Szczesny', '25', 1),
      xi('Jules Koundé', '23', 2),
      xi('Eric García', '24', 3),
      xi('Pau Cubarsí', '5', 4),
      xi('Gerard Martín', '18', 5),
      xi('Frenkie de Jong', '21', 6),
      xi('Pedri', '8', 7),
      xi('Lamine Yamal', '10', 8),
      xi('Dani Olmo', '20', 9),
      xi('Marcus Rashford', '14', 10),
      xi('Ferran Torres', '7', 11),
    ],
    away: [
      xi('Lucas Chevalier', '30', 1),
      xi('Achraf Hakimi', '2', 2),
      xi('Illia Zabarnyi', '6', 3),
      xi('Willian Pacho', '5', 4),
      xi('Nuno Mendes', '25', 5),
      xi('Warren Zaïre-Emery', '33', 6),
      xi('Vitinha', '17', 7),
      xi('Fabián Ruiz', '8', 8),
      xi('Ibrahim Mbaye', '49', 9),
      xi('Senny Mayulu', '24', 10),
      xi('Bradley Barcola', '29', 11),
    ],
  },
  bench: {
    home: [
      benchP('Joan García', '13'),
      benchP('Alejandro Balde', '3'),
      benchP('Andreas Christensen', '15'),
      benchP('Marc Casadó', '17'),
      benchP('Marc Bernal', '28'),
      benchP('Fermín López', '16'),
      benchP('Robert Lewandowski', '9'),
      benchP('Raphinha', '11'),
      benchP('Pablo Torre', '14'),
    ],
    away: [
      benchP('Matvey Safonov', '39'),
      benchP('Lucas Hernández', '4'),
      benchP('Presnel Kimpembe', '3'),
      benchP('João Neves', '87'),
      benchP('Lee Kang-in', '19'),
      benchP('Gonçalo Ramos', '9'),
      benchP('Désiré Doué', '14'),
      benchP('Ousmane Dembélé', '10'),
      benchP('Khvicha Kvaratskhelia', '7'),
    ],
  },
}

export function isDemoBarcaPsgShowcaseMatch(matchId: string | undefined | null): boolean {
  return DEMO_BARCA_PSG_SHOWCASE_ENABLED && matchId === DEMO_BARCA_PSG_MATCH_ID
}

export function buildDemoBarcaPsgLiveMatch(): Match {
  const elapsed = Math.floor((Date.now() - SHOWCASE_KICKOFF_MS) / 60_000)
  const minute = Math.min(44, Math.max(28, elapsed))
  return {
    id: DEMO_BARCA_PSG_MATCH_ID,
    provider: 'demo',
    competition: {
      id: 'ucl',
      name: 'UEFA Champions League',
      shortName: 'UCL',
    },
    home: { ...fcb, name: 'FC Barcelona', shortName: 'FCB' },
    away: { ...psg, name: 'Paris Saint-Germain', shortName: 'PSG' },
    kickoffAt: new Date(SHOWCASE_KICKOFF_MS).toISOString(),
    status: 'live',
    minute,
    score: { home: 1, away: 0 },
    venueName: 'Spotify Camp Nou',
    livePeriodTicking: true,
    liveClockPaused: false,
    liveInSecondHalf: false,
  }
}

/** Préfixe / remplace le showcase en tête de liste. */
export function mergeDemoBarcaPsgShowcase(list: Match[]): Match[] {
  if (!DEMO_BARCA_PSG_SHOWCASE_ENABLED) {
    return list.filter((m) => m.id !== DEMO_BARCA_PSG_MATCH_ID)
  }
  const demo = buildDemoBarcaPsgLiveMatch()
  const rest = list.filter((m) => m.id !== DEMO_BARCA_PSG_MATCH_ID)
  return [demo, ...rest]
}

export function demoBarcaPsgTimeline(matchId: string = DEMO_BARCA_PSG_MATCH_ID): Highlight[] {
  return [
    {
      id: 'sm-event-demo-fcb-kickoff',
      matchId,
      minute: 1,
      type: 'Info',
      title: 'Coup d’envoi',
      detail: 'Barça–PSG — le Camp Nou explose',
      order: 1,
    },
    {
      id: 'sm-event-demo-fcb-chance-8',
      matchId,
      minute: 8,
      type: 'Occasion',
      title: 'Occasion Barça',
      detail: 'Yamal centre, Ferran Torres trop court — Chevalier vigilant',
      side: 'home',
      order: 2,
    },
    {
      id: 'sm-event-demo-psg-yellow-14',
      matchId,
      minute: 14,
      type: 'Carton',
      title: 'Carton jaune',
      detail: 'Jaune — Vitinha (PSG) pour un tacle sur Pedri',
      side: 'away',
      scorerName: 'Vitinha',
      order: 3,
    },
    {
      id: 'sm-event-demo-fcb-goal-19',
      matchId,
      minute: 19,
      type: 'But',
      title: 'BUT Barça',
      detail: 'Ferran Torres ouvre le score — service de Lamine Yamal',
      side: 'home',
      scorerName: 'Ferran Torres',
      assistName: 'Lamine Yamal',
      order: 4,
    },
    {
      id: 'sm-event-demo-psg-chance-24',
      matchId,
      minute: 24,
      type: 'Occasion',
      title: 'Occasion PSG',
      detail: 'Barcola en profondeur, Szczesny sort au premier poteau',
      side: 'away',
      order: 5,
    },
    {
      id: 'sm-event-demo-fcb-yellow-27',
      matchId,
      minute: 27,
      type: 'Carton',
      title: 'Carton jaune',
      detail: 'Jaune — Frenkie de Jong (FCB) pour un retard de jeu',
      side: 'home',
      scorerName: 'Frenkie de Jong',
      order: 6,
    },
    {
      id: 'sm-event-demo-var-29',
      matchId,
      minute: 29,
      type: 'VAR',
      title: 'VAR',
      detail: 'Contrôle hors-jeu sur une contre-attaque parisienne — jeu validé',
      order: 7,
    },
    {
      id: 'sm-event-demo-info-30',
      matchId,
      minute: 30,
      type: 'Info',
      title: '30′',
      detail: 'Barça mène 1-0 — pression continue devant le Camp Nou',
      order: 8,
    },
  ]
}

export function demoBarcaPsgLiveStats(): LiveFixtureStatRow[] {
  return [
    { key: 'ball_possession', label: 'Possession', home: 58, away: 42 },
    { key: 'shots_total', label: 'Tirs', home: 7, away: 4 },
    { key: 'shots_on_target', label: 'Tirs cadrés', home: 3, away: 1 },
    { key: 'corners', label: 'Corners', home: 4, away: 2 },
    { key: 'fouls', label: 'Fautes', home: 5, away: 7 },
    { key: 'yellowcards', label: 'Cartons jaunes', home: 1, away: 1 },
    { key: 'passes_accurate', label: 'Passes réussies', home: 312, away: 248 },
  ]
}

type DemoChatSeed = LiveMatchChatMessageItem & { delayMs: number }

function chatSeed(
  id: string,
  username: string,
  text: string,
  tribune: MatchTribuneZone,
  delayMs: number,
  accent: LiveMatchChatMessageItem['avatarAccent'] = 'violet',
): DemoChatSeed {
  const createdAtMs = Date.now() - Math.max(0, 90_000 - delayMs)
  const time = new Date(createdAtMs).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return {
    id,
    userId: `demo-fan-${id}`,
    username,
    text,
    time,
    avatarSeed: `demo-${username}`,
    avatarAccent: accent,
    likes: Math.floor(Math.random() * 40),
    matchTribune: tribune,
    createdAtMs,
    delayMs,
  }
}

/** Messages tribune (apparaissent progressivement sur le channel). */
export const DEMO_BARCA_PSG_CHAT_SEEDS: DemoChatSeed[] = [
  chatSeed('c1', 'Culé_93', 'ALLEZ LE BARÇA 🔵🔴', 'home-ultras', 0, 'rose'),
  chatSeed('c2', 'ParisUltra', 'On va tout retourner ici', 'away-ultras', 400, 'amber'),
  chatSeed('c3', 'Tacticien_', 'Yamal déjà intouchable sur ce flanc', 'analystes', 900, 'violet'),
  chatSeed('c4', 'CampNouLive', 'FERRANAAAAA 1-0 !!!', 'home-ultras', 1400, 'rose'),
  chatSeed('c5', 'NeutreFoot', 'Quel but de Ferran, centre parfait de Yamal', 'neutres', 2000, 'emerald'),
  chatSeed('c6', 'PSG_Forever', 'Chevalier n’y est pour rien…', 'away-ultras', 2600, 'amber'),
  chatSeed('c7', 'BlaugranaFan', 'FUMIGÈNES 💨💨', 'home-ultras', 3200, 'rose'),
  chatSeed('c8', 'xG_nerd', 'xG ~0.9 Barça à la 20′ — mérité', 'analystes', 3800, 'violet'),
  chatSeed('c9', 'TribuneSud', 'TIFO GÉANT LES GARS', 'home-ultras', 4800, 'rose'),
  chatSeed('c10', 'Parisien77', 'Barcola va les faire souffrir', 'away-ultras', 5600, 'amber'),
  chatSeed('c11', 'MatchNight', 'Ambiance de folie au Camp Nou', 'neutres', 6400, 'emerald'),
  chatSeed('c12', 'PedriMagic', 'Pedri + De Jong = masterclass', 'home-ultras', 7200, 'rose'),
  chatSeed('c13', 'UltrasParis', 'Allez Paris on y croit 🔴🔵', 'away-ultras', 8000, 'amber'),
  chatSeed('c14', 'VarCheck', 'VAR clean sur la contre, jeu OK', 'analystes', 9000, 'violet'),
  chatSeed('c15', 'Culé_93', 'ON VEUT LE 2-0 🔥', 'home-ultras', 10_200, 'rose'),
  chatSeed('c16', 'FlashFoot', 'Possession 58% Barça — pression constante', 'neutres', 11_500, 'emerald'),
  chatSeed('c17', 'HakimiSpeed', 'Hakimi va monter, attention', 'away-ultras', 13_000, 'amber'),
  chatSeed('c18', 'OlmoFan', 'Olmo partout entre les lignes', 'home-ultras', 14_500, 'rose'),
  chatSeed('c19', 'LiveRoom', 'Confettis qui partent partout 🎊', 'neutres', 16_000, 'emerald'),
  chatSeed('c20', 'Tacticien_', 'PSG doit sortir Mayulu plus haut', 'analystes', 17_500, 'violet'),
  chatSeed('c21', 'Culé_93', 'STOOOOOOP LE STROBO 📱', 'home-ultras', 19_000, 'rose'),
  chatSeed('c22', 'ParisUltra', 'On tient le coup, 2e mi-temps à nous', 'away-ultras', 20_500, 'amber'),
  chatSeed('c23', 'CampNouLive', 'Le stade est en feu littéralement', 'home-ultras', 22_000, 'rose'),
  chatSeed('c24', 'NeutreFoot', 'Gros match de Ligue des champions 👏', 'neutres', 24_000, 'emerald'),
]

export type DemoPaidFxId = 'fumigene' | 'ola' | 'tifo-geant' | 'stroboscope'

export type DemoFxCue = {
  delayMs: number
  id: DemoPaidFxId
  label: string
  tifoSide?: 'home' | 'away'
  flareColor?: 'red' | 'blue' | 'green' | 'yellow'
}

/** File d’effets payants auto sur le channel (ambiance stade). */
export const DEMO_BARCA_PSG_FX_CUES: DemoFxCue[] = [
  { delayMs: 1800, id: 'ola', label: 'Confettis' },
  { delayMs: 4200, id: 'fumigene', label: 'Fumigène rouge', flareColor: 'red' },
  { delayMs: 7800, id: 'tifo-geant', label: 'Tifo géant', tifoSide: 'home' },
  { delayMs: 11_500, id: 'stroboscope', label: 'Flash téléphones' },
  { delayMs: 15_000, id: 'fumigene', label: 'Fumigène bleu', flareColor: 'blue' },
  { delayMs: 19_000, id: 'ola', label: 'Confettis' },
  { delayMs: 23_500, id: 'tifo-geant', label: 'Tifo géant', tifoSide: 'away' },
  { delayMs: 27_000, id: 'fumigene', label: 'Fumigène jaune', flareColor: 'yellow' },
  { delayMs: 31_000, id: 'stroboscope', label: 'Flash téléphones' },
  { delayMs: 35_500, id: 'fumigene', label: 'Fumigène vert', flareColor: 'green' },
  { delayMs: 40_000, id: 'ola', label: 'Confettis' },
  { delayMs: 45_000, id: 'tifo-geant', label: 'Tifo géant', tifoSide: 'home' },
]
