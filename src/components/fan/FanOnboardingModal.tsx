import { useEffect, useMemo, useState } from 'react'
import { competitionThemes } from '../../data/competitionThemes'
import {
  ALL_CLUBS_BY_ID,
  GLOBAL_SUGGESTED_CLUB_IDS,
  type ClubCatalogEntry,
} from '../../data/allClubsCatalog'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import { LogoMark } from '../../layout/LogoMark'
import { ClubSearchCombobox } from './ClubSearchCombobox'

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

  const handleFinish = () => {
    if (leagueId) completeOnboarding(leagueId, clubIds)
  }

  const addClubFromCatalog = (c: ClubCatalogEntry) => {
    setClubIds((prev) => toggleClubId(prev, c.id))
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fan-onboard-title"
    >
      <div className="max-h-[min(92dvh,720px)] w-full max-w-lg overflow-hidden rounded-[28px] border border-tf-grey-pastel/60 bg-tf-white shadow-[0_24px_80px_rgba(1,30,51,0.2)]">
        <div className="border-b border-tf-grey-pastel/50 bg-tf-ice/90 px-5 py-4">
          <div className="flex items-start gap-3">
            <LogoMark variant="compact" className="!h-8" decorative={false} />
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
              <p className="mt-1 text-sm font-semibold text-tf-grey">
                {step === 1
                  ? 'On adapte actus, salons et recommandations.'
                  : `Optionnel — jusqu’à ${MAX_CLUBS} clubs parmi toutes les équipes du catalogue. Tape quelques lettres pour ouvrir le menu.`}
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

        <div className="max-h-[min(56vh,420px)] overflow-y-auto px-5 py-4">
          {step === 1 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {leagueList.map((L) => {
                const selected = leagueId === L.id
                return (
                  <button
                    key={L.id}
                    type="button"
                    onClick={() => setLeagueId(L.id)}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-left text-sm font-black transition',
                      selected
                        ? 'border-tf-dark bg-tf-dark text-white shadow-md'
                        : 'border-tf-grey-pastel/60 bg-tf-white hover:bg-tf-grey-pastel/20',
                    )}
                    style={
                      !selected
                        ? {
                            borderColor: `${L.accent}55`,
                          }
                        : undefined
                    }
                  >
                    {L.name}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="fan-club-combobox" className="mb-1 block text-xs font-bold text-tf-grey">
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
                  <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-tf-grey">
                    Sélectionnés ({clubIds.length}/{MAX_CLUBS})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {clubIds.map((id) => {
                      const meta = ALL_CLUBS_BY_ID[id]
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setClubIds((prev) => prev.filter((x) => x !== id))}
                          className="inline-flex items-center gap-1.5 rounded-full border border-tf-dark/20 bg-tf-dark/5 px-3 py-1.5 text-left text-xs font-black text-tf-dark transition hover:bg-tf-dark/10"
                          title="Retirer ce club"
                        >
                          <span>{meta ? `${meta.shortName} (${meta.leagueName})` : labelForClubId(id)}</span>
                          <span className="text-tf-grey" aria-hidden>
                            ×
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-tf-grey">
                  Suggestions rapides
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedEntries.map((c) => {
                    const selected = clubIds.includes(c.id)
                    const atMax = clubIds.length >= MAX_CLUBS && !selected
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={atMax}
                        onClick={() => addClubFromCatalog(c)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40',
                          selected
                            ? 'border-tf-dark bg-tf-dark text-white'
                            : 'border-tf-grey-pastel/60 bg-white text-tf-dark hover:bg-tf-grey-pastel/20',
                        )}
                      >
                        {c.shortName}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tf-grey-pastel/50 bg-tf-grey-pastel/10 px-5 py-4">
          {preferencesComplete ? (
            <Button variant="ghost" className="rounded-2xl" onClick={closeOnboarding}>
              Annuler
            </Button>
          ) : (
            <span className="text-xs font-semibold text-tf-grey">
              Étape {step}/2 — ligue obligatoire, clubs libres
            </span>
          )}
          <div className="flex gap-2">
            {step === 2 ? (
              <Button variant="soft" className="rounded-2xl" onClick={() => setStep(1)}>
                Retour
              </Button>
            ) : null}
            {step === 1 ? (
              <Button
                variant="primary"
                className="rounded-2xl"
                disabled={!leagueId}
                onClick={() => setStep(2)}
              >
                Suivant
              </Button>
            ) : (
              <Button
                variant="primary"
                className="rounded-2xl"
                disabled={!leagueId}
                onClick={handleFinish}
              >
                Valider
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
