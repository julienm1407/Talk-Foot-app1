import { Link, useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'
import type { UseInboxReturn } from '../../hooks/useInbox'
import type { InboxFriendItem, InboxInviteItem, InboxNewsItem } from '../../types/inbox'

function UnreadDot({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span
      className="mt-1.5 size-2 shrink-0 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.7)]"
      aria-hidden
    />
  )
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3
      className={cn(
        'px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em]',
        className,
      )}
    >
      {children}
    </h3>
  )
}

export function InboxPanel({ onClose, inbox }: { onClose: () => void; inbox: UseInboxReturn }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const navigate = useNavigate()
  const { byKind, isRead, markRead, remove, markAllRead, items } = inbox

  const shell = L
    ? 'border border-tf-dark/12 bg-white text-tf-dark shadow-xl'
    : 'border border-white/12 bg-[#0c1829] text-white shadow-2xl'

  const rowHover = L ? 'hover:bg-tf-dark/[0.04]' : 'hover:bg-white/[0.06]'
  const muted = L ? 'text-tf-dark/72' : 'text-sky-100/80'
  const subtleBorder = L ? 'border-tf-dark/10' : 'border-white/10'

  const onOpenNews = (n: InboxNewsItem) => {
    markRead(n.id)
    onClose()
    navigate(n.href)
  }

  const onAcceptInvite = (inv: InboxInviteItem) => {
    markRead(inv.id)
    remove(inv.id)
    onClose()
    navigate(inv.href)
  }

  const onDeclineInvite = (id: string) => {
    remove(id)
  }

  const onAcceptFriend = (id: string) => {
    markRead(id)
    remove(id)
  }

  const onDeclineFriend = (id: string) => {
    remove(id)
  }

  return (
    <div
      className={cn(
        'absolute right-0 top-[calc(100%+10px)] z-[100] w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-2xl',
        shell,
      )}
      role="dialog"
      aria-label="Notifications"
    >
      <div className={cn('flex items-center justify-between gap-2 border-b px-3 py-2.5', subtleBorder)}>
        <span className="text-sm font-black">Notifications</span>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={() => markAllRead()}
            className={cn(
              'text-[11px] font-bold underline-offset-2 hover:underline',
              L ? 'text-sky-700' : 'text-sky-300',
            )}
          >
            Tout lu
          </button>
        ) : null}
      </div>

      <div className="max-h-[min(70vh,26rem)] overflow-y-auto">
        {items.length === 0 ? (
          <p className={cn('px-4 py-8 text-center text-sm font-semibold', muted)}>
            Aucune notification pour l’instant. Les top actus, invitations et demandes d’amis
            apparaîtront ici.
          </p>
        ) : (
          <>
            {byKind.news.length > 0 ? (
              <section aria-label="Top actus">
                <SectionTitle className={muted}>Top actus</SectionTitle>
                <ul className="divide-y" style={{ borderColor: L ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)' }}>
                  {byKind.news.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onOpenNews(n)}
                        className={cn('flex w-full gap-2 px-3 py-2.5 text-left transition', rowHover)}
                      >
                        <UnreadDot show={!isRead(n.id)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black leading-snug">{n.title}</p>
                          <p className={cn('mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug', muted)}>
                            {n.excerpt}
                          </p>
                          <p className={cn('mt-1 text-[10px] font-bold', muted)}>{n.createdAtLabel}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {byKind.invites.length > 0 ? (
              <section aria-label="Invitations">
                <SectionTitle className={cn('border-t', subtleBorder, muted)}>
                  Invitations · groupes & événements
                </SectionTitle>
                <ul className="divide-y" style={{ borderColor: L ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)' }}>
                  {byKind.invites.map((inv) => (
                    <li key={inv.id} className="px-3 py-2.5">
                      <div className="flex gap-2">
                        <UnreadDot show={!isRead(inv.id)} />
                        <div className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'inline-block rounded-md px-1.5 py-px text-[9px] font-black uppercase',
                              inv.subtype === 'group'
                                ? L
                                  ? 'bg-violet-100 text-violet-800'
                                  : 'bg-violet-500/20 text-violet-200'
                                : L
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-amber-500/20 text-amber-200',
                            )}
                          >
                            {inv.subtype === 'group' ? 'Groupe' : 'Événement'}
                          </span>
                          <p className="mt-1 text-xs font-black leading-snug">{inv.title}</p>
                          <p className={cn('mt-0.5 text-[11px] font-semibold leading-snug', muted)}>
                            {inv.subtitle}
                          </p>
                          <p className={cn('mt-1 text-[10px] font-bold', muted)}>{inv.createdAtLabel}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => onAcceptInvite(inv)}
                              className="rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-black text-white shadow-sm hover:bg-sky-500"
                            >
                              Accepter
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeclineInvite(inv.id)}
                              className={cn(
                                'rounded-lg border px-2.5 py-1 text-[11px] font-black',
                                L ? 'border-tf-dark/15 text-tf-dark' : 'border-white/20 text-white',
                              )}
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {byKind.friends.length > 0 ? (
              <section aria-label="Demandes d'amis">
                <SectionTitle className={cn('border-t', subtleBorder, muted)}>Demandes d&apos;amis</SectionTitle>
                <ul className="divide-y" style={{ borderColor: L ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)' }}>
                  {byKind.friends.map((f: InboxFriendItem) => (
                    <li key={f.id} className="px-3 py-2.5">
                      <div className="flex gap-2">
                        <UnreadDot show={!isRead(f.id)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black">{f.displayName}</p>
                          {f.mutualHint ? (
                            <p className={cn('mt-0.5 text-[11px] font-semibold', muted)}>{f.mutualHint}</p>
                          ) : null}
                          <p className={cn('mt-1 text-[10px] font-bold', muted)}>{f.createdAtLabel}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => onAcceptFriend(f.id)}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white shadow-sm hover:bg-emerald-500"
                            >
                              Accepter
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeclineFriend(f.id)}
                              className={cn(
                                'rounded-lg border px-2.5 py-1 text-[11px] font-black',
                                L ? 'border-tf-dark/15 text-tf-dark' : 'border-white/20 text-white',
                              )}
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>

      <div className={cn('border-t px-3 py-2', subtleBorder)}>
        <Link
          to="/"
          onClick={onClose}
          className={cn('block text-center text-[11px] font-bold underline-offset-2 hover:underline', L ? 'text-sky-700' : 'text-sky-300')}
        >
          Accueil & fil d’actus
        </Link>
      </div>
    </div>
  )
}
