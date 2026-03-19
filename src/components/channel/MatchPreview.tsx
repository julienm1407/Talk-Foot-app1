import { useEffect, useState } from 'react'
import type { Match } from '../../types/match'
import { formatKickoff } from '../../utils/time'
import { themeForCompetition } from '../../data/competitionThemes'
import { cn } from '../../utils/cn'

function useCountdown(kickoffAt: string) {
  const [diff, setDiff] = useState(() => {
    const ms = new Date(kickoffAt).getTime() - Date.now()
    return Math.max(0, ms)
  })
  useEffect(() => {
    const id = setInterval(() => {
      const ms = new Date(kickoffAt).getTime() - Date.now()
      setDiff(Math.max(0, ms))
    }, 1000)
    return () => clearInterval(id)
  }, [kickoffAt])
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, totalMs: diff }
}

function formFor(teamId: string): string[] {
  const seed = teamId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const out: string[] = []
  for (let i = 0; i < 5; i++) {
    const r = ((seed * (i + 1) * 7919) >>> 0) % 3
    out.push(r === 0 ? 'W' : r === 1 ? 'D' : 'L')
  }
  return out.reverse()
}

const MOCK_LINEUP = [
  ['M. Neuer', 'J. Kimmich', 'L. Hernández', 'D. Upamecano'],
  ['J. Rodri', 'K. De Bruyne', 'B. Silva', 'Phil Foden'],
  ['Courtois', 'Carvajal', 'Rüdiger', 'Alaba'],
  ['Donnarumma', 'Hakimi', 'Marquinhos', 'Ramos'],
  ['Ramsdale', 'Saliba', 'Gabriel', 'Zinchenko'],
]
function lineupFor(teamId: string): string[] {
  const idx =
    Math.abs(
      teamId.split('').reduce((a, c) => a + c.charCodeAt(0), 0),
    ) % MOCK_LINEUP.length
  return MOCK_LINEUP[idx]
}

const STADIUMS: Record<string, string> = {
  psg: 'Parc des Princes',
  om: 'Orange Vélodrome',
  monaco: 'Stade Louis-II',
  rma: 'Santiago Bernabéu',
  fcb: 'Spotify Camp Nou',
  bay: 'Allianz Arena',
  bvb: 'Signal Iduna Park',
  mci: 'Etihad Stadium',
  liv: 'Anfield',
  lyon: 'Groupama Stadium',
  lille: 'Decathlon Arena',
  rennes: 'Roazhon Park',
}

export function MatchPreview({ match }: { match: Match }) {
  const countdown = useCountdown(match.kickoffAt)
  const theme = themeForCompetition(match.competition.id)
  const homeForm = formFor(match.home.id ?? match.home.shortName)
  const awayForm = formFor(match.away.id ?? match.away.shortName)
  const homeLineup = lineupFor(match.home.id ?? match.home.shortName)
  const awayLineup = lineupFor(match.away.id ?? match.away.shortName)

  const formColor = (r: string) =>
    r === 'W' ? 'bg-emerald-500' : r === 'D' ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Coup d'envoi
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black tabular-nums text-slate-900">
            {formatKickoff(match.kickoffAt)}
          </span>
          <span className="text-sm font-semibold text-slate-600">
            {new Date(match.kickoffAt).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
        </div>
        {countdown.totalMs > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Dans</span>
            <span className="rounded-lg bg-slate-100 px-3 py-1 font-black tabular-nums text-slate-900">
              {String(countdown.h).padStart(2, '0')}:
              {String(countdown.m).padStart(2, '0')}:
              {String(countdown.s).padStart(2, '0')}
            </span>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Forme (5 derniers)
        </h3>
        <div className="mt-3 flex justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-800">
              {match.home.shortName}
            </div>
            <div className="mt-1.5 flex gap-1">
              {homeForm.map((r, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white',
                    formColor(r),
                  )}
                  title={r === 'W' ? 'Victoire' : r === 'D' ? 'Nul' : 'Défaite'}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="min-w-0 flex-1 text-right">
            <div className="text-xs font-bold text-slate-800">
              {match.away.shortName}
            </div>
            <div className="mt-1.5 flex justify-end gap-1">
              {awayForm.map((r, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white',
                    formColor(r),
                  )}
                  title={r === 'W' ? 'Victoire' : r === 'D' ? 'Nul' : 'Défaite'}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Compos probables
        </h3>
        <div className="mt-3 space-y-2">
          {homeLineup.slice(0, 4).map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-5 w-5 shrink-0 rounded-full"
                style={{ backgroundColor: `${match.home.colors.primary}50` }}
              />
              <span className="text-sm font-semibold text-slate-800">
                {name}
              </span>
            </div>
          ))}
          <div className="my-2 border-t border-dashed border-slate-200/70" />
          {awayLineup.slice(0, 4).map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-5 w-5 shrink-0 rounded-full"
                style={{ backgroundColor: `${match.away.colors.primary}50` }}
              />
              <span className="text-sm font-semibold text-slate-800">
                {name}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Infos
        </h3>
        <div className="mt-2 space-y-1.5 text-sm font-medium text-slate-700">
          <p>
            Stade :{' '}
            {STADIUMS[match.home.id ?? ''] ?? 'Stade du match'}
          </p>
          <p>Diffusion : Canal+ Sport, beIN Sports</p>
          {theme && (
            <div
              className="mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold"
              style={{
                backgroundColor: `${theme.accent}18`,
                color: theme.accent,
              }}
            >
              {match.competition.name}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
