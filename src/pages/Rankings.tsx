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
import { PointsBarChart } from '../components/rankings/PointsBarChart'
import { GoalsBalanceChart } from '../components/rankings/GoalsBalanceChart'
import { TeamIndicesRadar } from '../components/rankings/TeamIndicesRadar'
import { cn } from '../utils/cn'
import { SectionIntro } from '../components/ui/SectionIntro'
import { FriendsParieurMiniRank } from '../components/social/FriendsParieurMiniRank'

type MainTab = 'parieurs' | 'ligues' | 'forme'

export function RankingsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('parieurs')
  const [leagueId, setLeagueId] = useState<BigFiveLeagueId>('ligue-1')

  const standings = useMemo(() => getStandingsForLeague(leagueId), [leagueId])
  const theme = competitionThemes[leagueId]

  const tabClass = (t: MainTab) =>
    cn(
      'min-h-11 flex-1 rounded-2xl px-3 py-2.5 text-center text-xs font-black transition sm:min-h-0 sm:flex-none sm:px-5 sm:text-sm',
      mainTab === t
        ? 'bg-tf-dark text-white shadow-sm'
        : 'bg-tf-grey-pastel/30 text-tf-dark hover:bg-tf-grey-pastel/50',
    )

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
          <Card className="overflow-hidden p-4 sm:p-5" elevation="soft">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-black text-tf-dark sm:text-xl">
                  {theme?.name ?? leagueId}
                </h2>
                <p className="text-xs font-semibold text-tf-grey">Saison en cours (mock) · top 10</p>
              </div>
            </div>
            <LeagueStandingsTable leagueId={leagueId} rows={standings} />
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
          <p className="text-sm font-semibold text-tf-grey">
            Vue synthèse pour <strong className="text-tf-dark">{theme?.name}</strong> : points, buts, profils
            attaque/défense/dynamique (indices fictifs).
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <PointsBarChart
              rows={standings}
              leagueId={leagueId}
              title={`Points — ${theme?.name ?? leagueId}`}
            />
            <GoalsBalanceChart rows={standings} leagueId={leagueId} />
          </div>
          <TeamIndicesRadar rows={standings} leagueId={leagueId} />
        </div>
      ) : null}
    </div>
  )
}
