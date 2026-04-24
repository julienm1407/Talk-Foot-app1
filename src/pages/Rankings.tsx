import { useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { BettorLeaderboard } from '../components/home/BettorLeaderboard'
import { competitionThemes } from '../data/competitionThemes'
import {
  BIG_FIVE_LEAGUE_IDS,
  getStandingsForLeague,
  type BigFiveLeagueId,
} from '../data/leagueStandings'
import { LeagueStandingsTable } from '../components/rankings/LeagueStandingsTable'
import { StandingsInsightsStrip } from '../components/rankings/StandingsInsightsStrip'
import { RankingsScatterQuadrant } from '../components/rankings/RankingsScatterQuadrant'
import { PointsVsRecentFormChart } from '../components/rankings/PointsVsRecentFormChart'
import { RankingsCrossMatrix } from '../components/rankings/RankingsCrossMatrix'
import { cn } from '../utils/cn'
import { SectionIntro } from '../components/ui/SectionIntro'
import { FriendsParieurMiniRank } from '../components/social/FriendsParieurMiniRank'
import { useSportMonksLeagueStandings } from '../hooks/useSportMonksLeagueStandings'
import { getSportMonksToken } from '../utils/apiTokens'
import { Link } from 'react-router-dom'

type MainTab = 'parieurs' | 'ligues' | 'forme'

export function RankingsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('parieurs')
  const [leagueId, setLeagueId] = useState<BigFiveLeagueId>('ligue-1')

  const { standingsRows, standingsSource, standingsLoading, standingsError } =
    useSportMonksLeagueStandings(leagueId)

  const mockStandings = useMemo(() => getStandingsForLeague(leagueId), [leagueId])
  const hasToken = Boolean(getSportMonksToken())
  const standings = standingsRows.length ? standingsRows : mockStandings
  const dataSourceLabel =
    standingsRows.length && standingsSource === 'live'
      ? 'SportMonks · classement live'
      : standingsRows.length && standingsSource === 'season'
        ? 'SportMonks · classement saison'
        : standingsRows.length && standingsSource === 'teamsSeason'
          ? 'SportMonks · stats équipes (saison, tri points)'
          : standingsRows.length
            ? 'SportMonks'
            : hasToken
              ? 'Données de secours (maquette)'
              : 'Maquette (clé SportMonks requise pour les vrais classements)'

  const theme = competitionThemes[leagueId]

  const tabClass = (t: MainTab) =>
    cn(
      'min-h-11 flex-1 rounded-2xl px-3 py-2.5 text-center text-xs font-black transition sm:min-h-0 sm:flex-none sm:px-5 sm:text-sm',
      mainTab === t
        ? 'bg-tf-dark text-white shadow-sm'
        : 'bg-tf-grey-pastel/30 text-tf-dark hover:bg-tf-grey-pastel/50',
    )

  const matrixCaption = standingsRows.length
    ? `${dataSourceLabel} — indicateurs dérivés des mêmes lignes.`
    : 'Données d’illustration — avec une clé SportMonks, la matrice reflète le championnat réel.'

  return (
    <div className="space-y-6">
      <SectionIntro
        section="rankings"
        titleAs="h1"
        uppercaseTitle={false}
        eyebrow="Classements"
        title="Parieurs · Big 5 · Forme des équipes"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" role="tablist" aria-label="Sections classements">
        <button type="button" className={tabClass('parieurs')} onClick={() => setMainTab('parieurs')}>
          Parieurs
        </button>
        <button type="button" className={tabClass('ligues')} onClick={() => setMainTab('ligues')}>
          5 grands championnats
        </button>
        <button type="button" className={tabClass('forme')} onClick={() => setMainTab('forme')}>
          Dashboard forme
        </button>
      </div>

      {mainTab === 'parieurs' ? (
        <div className="space-y-4">
          <FriendsParieurMiniRank />
          <Card className="p-5 sm:p-6" elevation="soft">
            <p className="mb-4 text-[10px] font-black uppercase tracking-wider text-tf-grey">Classement global</p>
            <BettorLeaderboard extended />
          </Card>
        </div>
      ) : null}

      {mainTab === 'ligues' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {BIG_FIVE_LEAGUE_IDS.map((id) => {
              const th = competitionThemes[id]
              const active = leagueId === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLeagueId(id)}
                  className={cn(
                    'rounded-2xl border-2 px-4 py-2 text-xs font-black transition sm:text-sm',
                    active
                      ? 'border-tf-dark bg-tf-dark text-white shadow-md'
                      : 'border-tf-grey-pastel/60 bg-white text-tf-dark hover:border-tf-electric/35',
                  )}
                  style={
                    active && th
                      ? { borderColor: th.accent, backgroundColor: th.accent }
                      : undefined
                  }
                >
                  {th?.name ?? id}
                </button>
              )
            })}
          </div>

          {!hasToken ? (
            <p className="rounded-2xl border border-sky-300/50 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-950">
              Pour afficher les vrais classements SportMonks :{' '}
              <Link to="/settings/donnees#tf-sportmonks-cle" className="underline underline-offset-2">
                ajoute ta clé
              </Link>
              . En attendant, le tableau ci-dessous reste une illustration.
            </p>
          ) : null}

          {standingsError ? (
            <p className="rounded-2xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">
              API classements : {standingsError}. Vérifie ton abonnement SM ou configure un id saison (
              <code className="rounded bg-black/10 px-1 font-mono text-xs">VITE_SPORTMONKS_STANDING_SEASON_ID</code>
              ).
            </p>
          ) : null}

          {standingsLoading ? (
            <p className="text-sm font-semibold text-tf-grey">Chargement du classement…</p>
          ) : null}

          {standings.length ? (
            <StandingsInsightsStrip leagueId={leagueId} rows={standings} />
          ) : null}

          <Card className="overflow-hidden p-4 sm:p-5" elevation="soft" tone="solid">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-black text-tf-app-fg sm:text-xl">
                  {theme?.name ?? leagueId}
                </h2>
                <p className="text-xs font-semibold text-tf-app-muted">{dataSourceLabel}</p>
              </div>
            </div>
            <LeagueStandingsTable leagueId={leagueId} rows={standings} dataSourceLabel={dataSourceLabel} />
          </Card>
        </div>
      ) : null}

      {mainTab === 'forme' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {BIG_FIVE_LEAGUE_IDS.map((id) => {
              const th = competitionThemes[id]
              const active = leagueId === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLeagueId(id)}
                  className={cn(
                    'rounded-2xl border-2 px-3 py-2 text-[11px] font-black sm:px-4 sm:text-xs',
                    active
                      ? 'border-tf-dark bg-tf-dark text-white'
                      : 'border-tf-grey-pastel/60 bg-white text-tf-dark hover:border-tf-electric/35',
                  )}
                  style={active && th ? { borderColor: th.accent, backgroundColor: th.accent } : undefined}
                >
                  {th?.name ?? id}
                </button>
              )
            })}
          </div>

          {standings.length ? (
            <StandingsInsightsStrip leagueId={leagueId} rows={standings} />
          ) : null}

          {standingsError ? (
            <p className="rounded-2xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">
              API classements : {standingsError}
            </p>
          ) : null}
          {standingsLoading ? (
            <p className="text-sm font-semibold text-tf-grey">Chargement du classement…</p>
          ) : null}

          <p className="text-xs font-semibold leading-relaxed text-tf-grey">
            <strong className="text-tf-dark">{theme?.name}</strong> — une matrice (tous les croisements utiles) et deux
            vues graphiques : profil buts et tension saison / forme récente. Le détail match par match reste dans l’onglet
            « 5 grands championnats ».
          </p>

          <RankingsCrossMatrix rows={standings} leagueId={leagueId} caption={matrixCaption} />

          <div className="grid gap-3 lg:grid-cols-2">
            <RankingsScatterQuadrant
              rows={standings}
              leagueId={leagueId}
              subtitle={standingsRows.length ? 'Relatif à cette ligue' : 'Illustration'}
              accent={theme?.accent2}
            />
            <PointsVsRecentFormChart rows={standings} leagueId={leagueId} accent={theme?.accent2} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
