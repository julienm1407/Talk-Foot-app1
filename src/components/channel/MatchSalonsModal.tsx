import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { MatchSalonPick } from '../../utils/matchSalons'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

export function MatchSalonsModal({
  open,
  onClose,
  match,
  picks,
}: {
  open: boolean
  onClose: () => void
  match: Match
  picks: MatchSalonPick[]
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const reasonLabel = (p: MatchSalonPick) => {
    if (p.reason === 'home') return `Supporters ${match.home.shortName}`
    if (p.reason === 'away') return `Supporters ${match.away.shortName}`
    return match.competition.shortName
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center px-3 py-6 sm:px-4">
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <Card className="relative z-[1] flex max-h-[min(85vh,560px)] w-full max-w-md flex-col overflow-hidden border border-tf-grey-pastel/60 bg-tf-white/98 p-0 shadow-xl">
        <div className="shrink-0 border-b border-tf-grey-pastel/50 px-4 py-4 sm:px-5">
          <h2 className="font-display text-lg font-black tracking-tight text-tf-dark">
            Tribunes du match
          </h2>
          <p className="mt-1 text-sm font-medium text-tf-grey">
            {match.home.shortName} — {match.away.shortName} · communautés liées aux équipes ou à la compétition
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {picks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-tf-grey-pastel/70 bg-tf-grey-pastel/15 px-4 py-6 text-center">
              <p className="text-sm font-bold text-tf-dark">
                Aucune tribune tagué pour ce match
              </p>
              <p className="mt-2 text-xs font-medium text-tf-grey">
                Parcours les groupes pour rejoindre une tribune ou en créer une.
              </p>
              <Link to="/groups" onClick={onClose} className="mt-4 inline-flex">
                <Button variant="primary" className="w-full sm:w-auto">
                  Voir toutes les tribunes
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {picks.map(({ group, reason }) => (
                <li key={group.id}>
                  <Link
                    to={`/group/${group.id}`}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border border-tf-grey-pastel/50 bg-white/95 px-4 py-3',
                      'transition hover:border-tf-electric/30 hover:bg-tf-ice/50',
                    )}
                  >
                    <span className="text-2xl" aria-hidden>
                      {group.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-sm font-black text-tf-dark">
                        {group.name}
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-tf-grey">
                        {reasonLabel({ group, reason })}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-black text-tf-electric">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-tf-grey-pastel/50 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Fermer
            </Button>
            <Link to="/groups" onClick={onClose} className="flex-1">
              <Button variant="soft" className="w-full">
                Toutes les tribunes
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
