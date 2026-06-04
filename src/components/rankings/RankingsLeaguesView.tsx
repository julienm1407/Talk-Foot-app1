import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Card } from '../ui/Card'
import { competitionThemes } from '../../data/competitionThemes'
import {
  BIG_FIVE_LEAGUE_IDS,
  getStandingsForLeague,
  type BigFiveLeagueId,
} from '../../data/leagueStandings'
import { LeagueStandingsTable } from './LeagueStandingsTable'
import { StandingsInsightsStrip } from './StandingsInsightsStrip'
import { RankingsScatterQuadrant } from './RankingsScatterQuadrant'
import { PointsVsRecentFormChart } from './PointsVsRecentFormChart'
import { RankingsCrossMatrix } from './RankingsCrossMatrix'
import { cn } from '../../utils/cn'
import { SectionIntro } from '../ui/SectionIntro'
import { useSportMonksLeagueStandings } from '../../hooks/useSportMonksLeagueStandings'
import { getSportMonksToken } from '../../utils/apiTokens'
import { useAppearance } from '../../contexts/AppearanceContext'

type MainTab = 'ligues' | 'forme'

/** Classements Big 5 — affiché hors mode Coupe du Monde 2026. */
export function RankingsLeaguesView() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const [mainTab, setMainTab] = useState<MainTab>('ligues')
  const [leagueId, setLeagueId] = useState<BigFiveLeagueId>('ligue-1')
  const reducedMotion = useReducedMotion()

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
        title="Big 5 · Forme des équipes"
        description="Classements des championnats et analyses de forme. Pendant le Mondial, les poules CDM sont sur cette page en mode Coupe du Monde."
      />

      <p className="rounded-2xl border border-tf-cdm-gold/35 bg-tf-cdm-gold/10 px-4 py-3 text-sm font-semibold text-tf-app-fg">
        Pendant le Mondial 2026, les classements des poules sont sur{' '}
        <Link to="/cdm/groupes" className="font-black text-tf-cdm-gold underline-offset-2 hover:underline">
          CDM → Poules
        </Link>{' '}
        ou active le mode Coupe du Monde dans ton profil.
      </p>

      <p className="rounded-2xl border border-tf-electric/25 bg-tf-electric-soft/35 px-4 py-3 text-sm font-semibold text-tf-dark">
        Classement des parieurs (points, victoires) :{' '}
        <Link to="/pronostic?vue=classement" className="font-black text-tf-cta underline-offset-2 hover:underline">
          Pronostic → Classement parieurs
        </Link>
        .
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" role="tablist" aria-label="Sections classements">
        <button type="button" className={tabClass('ligues')} onClick={() => setMainTab('ligues')}>
          5 grands championnats
        </button>
        <button type="button" className={tabClass('forme')} onClick={() => setMainTab('forme')}>
          Dashboard forme
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {mainTab === 'ligues' ? (
          <motion.div
            key="tab-ligues"
            className="space-y-4"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
            exit={reducedMotion ? {} : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
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
                        ? L
                          ? 'border-tf-dark bg-tf-dark text-white shadow-md'
                          : 'border-sky-300/45 bg-sky-500/20 text-white shadow-md'
                        : L
                          ? 'border-tf-grey-pastel/60 bg-white text-tf-dark hover:border-tf-electric/35'
                          : 'border-white/20 bg-white/[0.06] text-sky-100 hover:border-sky-300/40 hover:bg-white/[0.1]',
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

            {standings.length ? <StandingsInsightsStrip leagueId={leagueId} rows={standings} /> : null}

            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.04 }}
            >
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
            </motion.div>
          </motion.div>
        ) : null}

        {mainTab === 'forme' ? (
          <motion.div
            key="tab-forme"
            className="space-y-4"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
            exit={reducedMotion ? {} : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
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
                        ? L
                          ? 'border-tf-dark bg-tf-dark text-white'
                          : 'border-sky-300/45 bg-sky-500/20 text-white'
                        : L
                          ? 'border-tf-grey-pastel/60 bg-white text-tf-dark hover:border-tf-electric/35'
                          : 'border-white/20 bg-white/[0.06] text-sky-100 hover:border-sky-300/40 hover:bg-white/[0.1]',
                    )}
                    style={active && th ? { borderColor: th.accent, backgroundColor: th.accent } : undefined}
                  >
                    {th?.name ?? id}
                  </button>
                )
              })}
            </div>

            {standings.length ? <StandingsInsightsStrip leagueId={leagueId} rows={standings} /> : null}

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

            <motion.div
              className="grid gap-3 lg:grid-cols-2"
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.04 }}
            >
              <RankingsScatterQuadrant
                rows={standings}
                leagueId={leagueId}
                subtitle={standingsRows.length ? 'Relatif à cette ligue' : 'Illustration'}
                accent={theme?.accent2}
              />
              <PointsVsRecentFormChart rows={standings} leagueId={leagueId} accent={theme?.accent2} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
