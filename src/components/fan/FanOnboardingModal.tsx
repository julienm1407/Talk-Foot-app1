import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { competitionThemes } from '../../data/competitionThemes'
import {
  ALL_CLUBS_BY_ID,
  GLOBAL_SUGGESTED_CLUB_IDS,
  type ClubCatalogEntry,
} from '../../data/allClubsCatalog'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import { LogoEncart } from '../../layout/LogoMark'
import { ClubSearchCombobox } from './ClubSearchCombobox'
import { ClubCrest } from '../brand/ClubCrest'
import { findTeamInAnyLeague } from '../../data/allClubsCatalog'
import { resolveClubCatalogLogoUrl } from '../../utils/catalogLogos'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'

const MAX_CLUBS = 3

const LEAGUE_ORDER = ['ligue-1', 'epl', 'laliga', 'serie-a', 'bund'] as const

function toggleClubId(current: string[], id: string): string[] {
  if (current.includes(id)) return current.filter((x) => x !== id)
  if (current.length >= MAX_CLUBS) return current
  return [...current, id]
}

function labelForClubId(id: string): string {
  return ALL_CLUBS_BY_ID[id]?.shortName ?? id
}

export function FanOnboardingModal() {
  const {
    onboardingOpen,
    completeOnboarding,
    closeOnboarding,
    preferencesComplete,
    favoriteLeagueId,
    favoriteClubIds,
  } = useFanPreferences()
  const [step, setStep] = useState<1 | 2>(1)
  const [leagueId, setLeagueId] = useState<string | null>(null)
  const [clubIds, setClubIds] = useState<string[]>([])
  const [clubQuery, setClubQuery] = useState('')

  useEffect(() => {
    if (!onboardingOpen) return
    setStep(1)
    setLeagueId(favoriteLeagueId)
    setClubIds([...favoriteClubIds].slice(0, MAX_CLUBS))
    setClubQuery('')
  }, [onboardingOpen, favoriteLeagueId, favoriteClubIds])

  const leagueList = useMemo(
    () =>
      LEAGUE_ORDER.map((id) => competitionThemes[id]).filter(
        Boolean,
      ) as Array<(typeof competitionThemes)[string]>,
    [],
  )

  const suggestedEntries = useMemo(() => {
    return GLOBAL_SUGGESTED_CLUB_IDS.map((id) => ALL_CLUBS_BY_ID[id]).filter(
      (e): e is ClubCatalogEntry => Boolean(e),
    )
  }, [])

  if (!onboardingOpen) return null

  const portalTarget = getModalPortalRoot()
  if (!portalTarget) return null

  const handleFinish = () => {
    if (leagueId) completeOnboarding(leagueId, clubIds)
  }

  const addClubFromCatalog = (c: ClubCatalogEntry) => {
    setClubIds((prev) => toggleClubId(prev, c.id))
  }

  return createPortal(
    <div
      className={cn(
        'pointer-events-auto fixed inset-0 z-[1] flex touch-manipulation items-end justify-center overflow-hidden',
        'h-[100dvh] max-h-[100dvh]',
        'p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))]',
        'sm:items-center',
      )}
      data-no-swipe="true"
      data-tf-modal="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fan-onboard-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={closeOnboarding}
        aria-label="Fermer"
      />
      <div className="relative z-10 flex max-h-[min(calc(100dvh-2rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)),720px)] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-tf-grey-pastel/60 bg-tf-white text-tf-dark shadow-[0_24px_80px_rgba(1,30,51,0.2)]">
        <div className="shrink-0 border-b border-tf-grey-pastel/50 bg-tf-ice/90 px-5 py-4">
          <div className="flex items-start gap-3">
            <LogoEncart isLight decorative={false} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-black tracking-[0.2em] text-tf-grey">
                PERSONNALISATION
              </div>
              <h2
                id="fan-onboard-title"
                className="mt-1 font-display text-2xl font-black tracking-tight text-tf-dark"
              >
                {step === 1 ? 'Ta ligue favorite' : 'Tes clubs favoris'}
              </h2>
              <p className="mt-1 text-sm font-semibold leading-snug text-slate-600">
                {step === 1
                  ? 'Choisis ta ligue principale pour personnaliser l’expérience.'
                  : `Choisis jusqu’à ${MAX_CLUBS} clubs (optionnel).`}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span
              className={cn(
                'h-1.5 flex-1 rounded-full',
                step >= 1 ? 'bg-tf-dark' : 'bg-tf-grey-pastel/60',
              )}
            />
            <span
              className={cn(
                'h-1.5 flex-1 rounded-full',
                step >= 2 ? 'bg-tf-dark' : 'bg-tf-grey-pastel/60',
              )}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {step === 1 ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {leagueList.map((L) => {
                const selected = leagueId === L.id
                return (
                  <button
                    key={L.id}
                    type="button"
                    onClick={() => setLeagueId(L.id)}
                    className={cn(
                      'min-h-[3.5rem] rounded-2xl border-2 px-4 py-3 text-left transition',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-dark/40 focus-visible:ring-offset-2',
                      selected
                        ? 'border-tf-dark bg-tf-dark text-white shadow-md'
                        : cn(L.labelBg, L.labelText, 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'),
                    )}
                    style={
                      selected
                        ? { boxShadow: `0 8px 20px ${L.accent}33` }
                        : { borderLeftWidth: 4, borderLeftColor: L.accent2 }
                    }
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          'text-[15px] font-black leading-tight',
                          selected ? 'text-white' : L.labelText,
                        )}
                      >
                        {L.name}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                          selected ? 'bg-white/15 text-white/90' : 'bg-black/[0.06] text-current/70',
                        )}
                        aria-hidden
                      >
                        {L.shortName}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-visible">
                <label htmlFor="fan-club-combobox" className="mb-1 block text-xs font-bold text-slate-700">
                  Rechercher un club
                </label>
                <ClubSearchCombobox
                  query={clubQuery}
                  onQueryChange={setClubQuery}
                  onPick={addClubFromCatalog}
                  excludeIds={clubIds}
                  maxReached={clubIds.length >= MAX_CLUBS}
                />
              </div>

              {clubIds.length > 0 ? (
                <div>
                  <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Sélectionnés ({clubIds.length}/{MAX_CLUBS})
                  </div>
                  <div className="flex flex-col gap-2">
                    {clubIds.map((id) => {
                      const meta = ALL_CLUBS_BY_ID[id]
                      const team = findTeamInAnyLeague(id)
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setClubIds((prev) => prev.filter((x) => x !== id))}
                          className="flex min-h-[2.75rem] w-full items-center gap-2.5 rounded-xl border-2 border-tf-dark bg-tf-dark px-3 py-2 text-left text-sm font-bold text-white transition hover:bg-slate-800"
                          title="Retirer ce club"
                        >
                          {team ? (
                            <ClubCrest
                              id={team.id}
                              shortName={team.shortName}
                              colors={team.colors}
                              logoUrl={resolveClubCatalogLogoUrl(id) ?? undefined}
                              size={22}
                              clickable={false}
                              className="rounded-full"
                            />
                          ) : null}
                          <span className="min-w-0 flex-1 truncate">
                            {meta ? `${meta.name} (${meta.leagueName})` : labelForClubId(id)}
                          </span>
                          <span className="shrink-0 text-white/80" aria-hidden>
                            ×
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Suggestions rapides
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {suggestedEntries.map((c) => {
                    const selected = clubIds.includes(c.id)
                    const atMax = clubIds.length >= MAX_CLUBS && !selected
                    const team = findTeamInAnyLeague(c.id)
                    const leagueTheme = competitionThemes[c.leagueId]
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={atMax}
                        onClick={() => addClubFromCatalog(c)}
                        className={cn(
                          'flex min-h-[2.85rem] items-center justify-center gap-2 rounded-xl border-2 px-2.5 py-2 text-sm font-bold transition',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-dark/35 focus-visible:ring-offset-1',
                          'disabled:cursor-not-allowed disabled:opacity-45',
                          selected
                            ? 'border-tf-dark bg-tf-dark text-white shadow-sm'
                            : cn(
                                leagueTheme?.labelBg ?? 'bg-slate-50',
                                leagueTheme?.labelText ?? 'text-slate-900',
                                'border-slate-200 hover:border-slate-300 hover:shadow-sm',
                              ),
                        )}
                      >
                        {team ? (
                          <ClubCrest
                            id={team.id}
                            shortName={team.shortName}
                            colors={team.colors}
                            logoUrl={resolveClubCatalogLogoUrl(c.id) ?? undefined}
                            size={22}
                            clickable={false}
                            className="shrink-0 rounded-full"
                          />
                        ) : null}
                        <span className={cn('truncate', selected && 'text-white')}>{c.shortName}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-tf-grey-pastel/50 bg-tf-grey-pastel/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-semibold text-slate-600">
            Étape {step}/2 — ligue obligatoire, clubs libres
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" className="min-h-11 rounded-2xl" onClick={closeOnboarding}>
              {preferencesComplete ? 'Annuler' : 'Plus tard'}
            </Button>
            {step === 2 ? (
              <Button variant="soft" className="min-h-11 rounded-2xl" onClick={() => setStep(1)}>
                Retour
              </Button>
            ) : null}
            {step === 1 ? (
              <Button
                variant="primary"
                className="min-h-11 rounded-2xl"
                disabled={!leagueId}
                onClick={() => setStep(2)}
              >
                Suivant
              </Button>
            ) : (
              <Button
                variant="primary"
                className="min-h-11 rounded-2xl"
                disabled={!leagueId}
                onClick={handleFinish}
              >
                Valider
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  )
}
