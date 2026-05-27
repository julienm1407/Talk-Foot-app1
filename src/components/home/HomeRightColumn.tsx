import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { Debate } from '../../data/debates'
import type { SupporterGroup } from '../../types/group'
import { cn } from '../../utils/cn'
import { AdSlot } from '../ui/AdSlot'
import { TribuneShowcaseCard } from '../tribune/TribuneShowcaseCard'

export function HomeRightColumn({
  debates,
  groups,
  onCreateGroup,
  showDebatesSection = true,
}: {
  debates: Debate[]
  groups: SupporterGroup[]
  onCreateGroup: () => void
  /** Sur l’accueil : débats déjà au centre + bande tendances */
  showDebatesSection?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {showDebatesSection ? (
        <>
          <Card className="rounded-2xl p-4 shadow-sm" elevation="soft">
            <h3 className="border-b border-tf-grey-pastel/45 pb-2 font-display text-sm font-black uppercase tracking-[0.18em] text-tf-dark">
              Zone de débat
            </h3>
            <ul className="mt-3 space-y-2" role="list">
              {debates.map((d) => (
                <li key={d.id}>
                  <Link
                    to={`/debate/${d.id}`}
                    className={cn(
                      'block rounded-xl border border-tf-grey-pastel/40 bg-tf-grey-pastel/10 px-2.5 py-2 transition',
                      'hover:border-tf-grey-pastel/70 hover:bg-white/90',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/30',
                    )}
                  >
                    <p className="line-clamp-2 text-xs font-bold leading-snug text-tf-dark">{d.title}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold text-tf-grey">
                      <span className="inline-flex items-center gap-1" title="Participants">
                        <span aria-hidden>👤</span>
                        {d.participantsCount.toLocaleString('fr-FR')}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Messages">
                        <span aria-hidden>💬</span>
                        {d.messagesCount.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/debates"
              className="mt-2 block text-center text-[11px] font-black text-tf-electric-deep underline-offset-2 hover:underline"
            >
              Tous les débats
            </Link>
          </Card>

          <AdSlot
            compact
            tone="blue"
            brand="Débats sponsorisés"
            body="Colonne droite — entre débats et groupes."
            imageSeed="home-right-mid"
          />
        </>
      ) : null}

      <div className="rounded-2xl border border-tf-grey-pastel/40 bg-tf-white/90 p-4 shadow-sm">
        <h3 className="border-b border-tf-grey-pastel/45 pb-2 font-display text-sm font-black uppercase tracking-[0.18em] text-tf-dark">
          Tribunes
        </h3>
        <ul className="mt-3 space-y-2" role="list">
          {groups.map((g) => (
            <li key={g.id}>
              <TribuneShowcaseCard group={g} variant="rail" dense />
            </li>
          ))}
        </ul>
        <div className="mt-3 grid gap-1.5">
          <Button
            type="button"
            variant="soft"
            className="tf-interactive-press w-full rounded-xl border-tf-grey-pastel/60 py-2 text-xs font-black"
            onClick={onCreateGroup}
          >
            Créer ton groupe
          </Button>
          <Link
            to="/groups"
            className={cn(
              'tf-interactive-press flex w-full items-center justify-center rounded-xl bg-tf-dark py-2 text-xs font-black text-white shadow-sm',
              'transition hover:bg-tf-dark-alt',
            )}
          >
            Voir tous les groupes
          </Link>
        </div>
      </div>
    </div>
  )
}
