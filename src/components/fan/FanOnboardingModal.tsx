import { useEffect, useMemo, useState } from 'react'
import { competitionThemes } from '../../data/competitionThemes'
import { teams } from '../../data/teams'
import type { Team } from '../../types/match'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import { LogoMark } from '../../layout/LogoMark'

function clubsForLeague(leagueId: string): Team[] {
  const key = leagueId as keyof typeof teams
  const raw = teams[key]
  return raw ? [...raw] : []
}

const LEAGUE_ORDER = ['ligue-1', 'epl', 'laliga', 'serie-a', 'bund'] as const

export function FanOnboardingModal() {
  const {
    onboardingOpen,
    completeOnboarding,
    closeOnboarding,
    preferencesComplete,
    favoriteLeagueId,
    favoriteClubId,
  } = useFanPreferences()
  const [step, setStep] = useState<1 | 2>(1)
  const [leagueId, setLeagueId] = useState<string | null>(null)
  const [clubId, setClubId] = useState<string | null>(null)

  useEffect(() => {
    if (!onboardingOpen) return
    setStep(1)
    setLeagueId(favoriteLeagueId)
    setClubId(favoriteClubId)
  }, [onboardingOpen, favoriteLeagueId, favoriteClubId])

  const leagueList = useMemo(
    () =>
      LEAGUE_ORDER.map((id) => competitionThemes[id]).filter(
        Boolean,
      ) as Array<(typeof competitionThemes)[string]>,
    [],
  )

  const clubList: Team[] = useMemo(
    () => (leagueId ? clubsForLeague(leagueId) : []),
    [leagueId],
  )

  if (!onboardingOpen) return null

  const handleFinish = () => {
    if (leagueId && clubId) completeOnboarding(leagueId, clubId)
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
                {step === 1 ? 'Ta ligue favorite' : 'Ton club de cœur'}
              </h2>
              <p className="mt-1 text-sm font-semibold text-tf-grey">
                {step === 1
                  ? 'On adapte actus, salons et recommandations.'
                  : 'Filtrage des salons rivaux & mode Virage possibles.'}
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
                    onClick={() => {
                      setLeagueId(L.id)
                      setClubId(null)
                    }}
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
            <div className="grid gap-2 sm:grid-cols-2">
              {clubList.map((t) => {
                const selected = clubId === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setClubId(t.id)}
                    className={cn(
                      'rounded-2xl border px-3 py-2.5 text-left transition',
                      selected
                        ? 'border-tf-dark bg-tf-dark text-white'
                        : 'border-tf-grey-pastel/60 bg-white hover:bg-tf-grey-pastel/15',
                    )}
                  >
                    <div className="text-sm font-black">{t.shortName}</div>
                    <div className="truncate text-xs font-semibold opacity-80">
                      {t.name}
                    </div>
                  </button>
                )
              })}
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
              Étape {step}/2 — obligatoire pour continuer
            </span>
          )}
          <div className="flex gap-2">
            {step === 2 ? (
              <Button
                variant="soft"
                className="rounded-2xl"
                onClick={() => setStep(1)}
              >
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
                disabled={!clubId}
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
