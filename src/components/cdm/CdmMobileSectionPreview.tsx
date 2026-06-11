import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMatches } from '../../contexts/MatchesContext'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { getNationByIso } from '../../data/nations'
import { NationCard } from './NationCard'
import { matchCalendarDayKeyParis, formatKickoff } from '../../utils/time'
import { WC_2026_COMP_ID } from '../../utils/seasonMode'
import { cn } from '../../utils/cn'
import { useFavoriteNationsLookup } from '../../hooks/useFavoriteNationsMatches'
import { MatchTeamsVsInline } from '../match/MatchTeamSideLabel'
import type { Match } from '../../types/match'

function CdmMatchPreviewRow({ match }: { match: Match }) {
  const { matchTeam } = useFavoriteNationsLookup()
  const favHome = matchTeam(match.home.name)
  const favAway = matchTeam(match.away.name)
  const isFav = Boolean(favHome || favAway)

  return (
    <Link
      to="/cdm"
      aria-label={`Coupe du Monde — ${match.home.name} vs ${match.away.name}`}
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-tf-c30-border bg-white/[0.04] px-3 py-2.5 transition',
        'hover:border-tf-cdm-gold/55 hover:bg-white/[0.08]',
        match.status === 'live' ? 'ring-1 ring-rose-400/45' : null,
        isFav && match.status !== 'live'
          ? 'border-tf-cdm-gold/60 bg-tf-cdm-gold/[0.07] ring-1 ring-tf-cdm-gold/40'
          : null,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {match.status === 'live' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              <span aria-hidden className="h-1 w-1 animate-pulse rounded-full bg-white" />
              Live · {match.minute ?? 0}&apos;
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-wider text-tf-cdm-gold">
              {formatKickoff(match.kickoffAt)}
            </span>
          )}
          {isFav ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-tf-cdm-gold/60 bg-tf-cdm-gold/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-tf-cdm-gold">
              <span aria-hidden>★</span>
              Ma sélection
            </span>
          ) : null}
        </div>
        <MatchTeamsVsInline
          className="mt-0.5"
          home={match.home}
          away={match.away}
          competitionId={match.competition.id}
          homeHighlight={Boolean(favHome)}
          awayHighlight={Boolean(favAway)}
        />
      </div>
      {match.score ? (
        <div className="font-display text-xl font-black tabular-nums text-tf-app-fg">
          {match.score.home}–{match.score.away}
        </div>
      ) : (
        <div className="text-xs font-black uppercase tracking-wide text-tf-cdm-gold">Voir CDM →</div>
      )}
    </Link>
  )
}

/** Aperçu encart CDM mobile — match du jour (style CDM), sinon sélection favorite. */
export function CdmMobileSectionPreview() {
  const { matches, loading } = useMatches()
  const { favoriteNationIsos } = useFanPreferences()

  const { previewMatch, isToday } = useMemo(() => {
    const todayKey = matchCalendarDayKeyParis(new Date())
    const wc = matches
      .filter((m) => m.competition.id === WC_2026_COMP_ID)
      .filter((m) => m.status === 'live' || m.status === 'upcoming')
    const today = wc
      .filter((m) => matchCalendarDayKeyParis(m.kickoffAt) === todayKey)
      .sort((a, b) => Date.parse(a.kickoffAt) - Date.parse(b.kickoffAt))
    if (today[0]) return { previewMatch: today[0], isToday: true }
    const next = [...wc].sort((a, b) => Date.parse(a.kickoffAt) - Date.parse(b.kickoffAt))[0]
    return { previewMatch: next ?? null, isToday: false }
  }, [matches])

  const favNation = useMemo(() => {
    const iso = favoriteNationIsos[0]
    return iso ? getNationByIso(iso) : null
  }, [favoriteNationIsos])

  if (loading && !previewMatch) {
    return (
      <p className="rounded-xl border border-dashed border-tf-c30-border/80 px-3 py-4 text-center text-xs font-bold text-tf-app-muted">
        Chargement CDM…
      </p>
    )
  }

  if (previewMatch) {
    return (
      <div className="space-y-1.5">
        <p className="px-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-tf-cdm-gold">
          {isToday ? 'Match du jour' : 'Prochain match CDM'}
        </p>
        <CdmMatchPreviewRow match={previewMatch} />
      </div>
    )
  }

  if (favNation) {
    return (
      <div className="space-y-2">
        <p className="px-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-tf-cdm-gold">
          Ma sélection
        </p>
        <NationCard nation={favNation} variant="tile" className="max-w-[8.5rem]" />
      </div>
    )
  }

  return (
    <Link
      to="/cdm"
      className="flex items-center gap-3 rounded-xl border border-tf-c30-border bg-tf-c30-surface px-3 py-3 transition hover:border-tf-cdm-gold/50"
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-xl text-base font-black"
        style={{ background: '#f4c542', color: '#06214a' }}
        aria-hidden
      >
        ★
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-tf-app-fg">Hub Coupe du Monde</span>
        <span className="block text-[11px] font-semibold text-tf-app-muted">
          Poules, sélections et calendrier complet
        </span>
      </span>
      <span className="text-sm font-black text-tf-cdm-gold" aria-hidden>
        →
      </span>
    </Link>
  )
}
