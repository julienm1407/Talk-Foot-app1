import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useDebates } from '../contexts/DebatesContext'
import { DebateMessagePreview } from '../components/debate/DebateMessagePreview'
import { SectionIntro } from '../components/ui/SectionIntro'
import { cn } from '../utils/cn'
import { DebateRankBadge } from '../components/debate/DebateRankBadge'
import { CreateDebateHubModal } from '../components/debate/CreateDebateHubModal'
import { TribuneLimitPopup } from '../components/subscription/TribuneLimitPopup'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { canCreateDebate } from '../utils/subscriptionEntitlements'
import { debatePageHref } from '../utils/debateAccess'
import { DebateGroupBadge } from '../components/debate/DebateGroupBadge'

export function DebatesPage() {
  const { debates: all, loading } = useDebates()
  const navigate = useNavigate()
  const location = useLocation()
  const { user: authUser } = useAuth()
  const { tier, subscription, plan } = useSubscription()
  const { myJoinedGroups, orphanJoinedGroupIds, groupLimits } = useSupporterGroups()
  const [createOpen, setCreateOpen] = useState(false)
  const [limitPopupOpen, setLimitPopupOpen] = useState(false)
  const isAdmin = Boolean(authUser?.isAdmin)
  const canAddDebate = canCreateDebate(tier, subscription.usage ?? {}, new Date(), isAdmin).ok

  const openLimitPopup = useCallback(() => {
    setCreateOpen(false)
    setLimitPopupOpen(true)
  }, [])

  const handleCreateClick = useCallback(() => {
    const next = `${location.pathname}${location.search}`
    if (!authUser?.id || authUser.isAnonymous) {
      navigate(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    if (!isAdmin && !plan.flags.canCreateDebates) {
      openLimitPopup()
      return
    }
    if (!canCreateDebate(tier, subscription.usage ?? {}, new Date(), isAdmin).ok) {
      openLimitPopup()
      return
    }
    setLimitPopupOpen(false)
    setCreateOpen(true)
  }, [
    authUser?.id,
    authUser?.isAnonymous,
    isAdmin,
    location.pathname,
    location.search,
    navigate,
    openLimitPopup,
    plan.flags.canCreateDebates,
    subscription.usage,
    tier,
  ])

  return (
    <div className="space-y-6">
      <SectionIntro
        section="debates"
        titleAs="h1"
        uppercaseTitle={false}
        eyebrow="Débats"
        title="Tribunes & polémiques"
        description="Espaces de discussion ouverts autour d’un sujet — participe sans rejoindre de tribune. Classement par activité récente."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              to="/groups"
              className="tf-interactive-press inline-flex min-h-11 items-center justify-center rounded-3xl border-2 border-violet-300/55 bg-violet-50/90 px-4 text-xs font-black text-tf-dark shadow-sm hover:bg-violet-100 sm:px-5 sm:text-sm"
            >
              👥 Tribunes
            </Link>
            <Button
              variant="primary"
              className="tf-interactive-press shrink-0 rounded-3xl px-5"
              onClick={handleCreateClick}
            >
              ➕ Créer un débat
            </Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm font-semibold text-tf-grey">Chargement des débats…</p>
      ) : all.length === 0 ? (
        <Card elevation="soft" className="border-dashed p-8 text-center">
          <p className="font-black text-tf-dark">Aucun débat pour le moment</p>
          <p className="mt-2 text-sm font-semibold text-tf-grey">
            Lance un sujet ouvert — les compteurs participants et messages sont calculés en temps réel.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button variant="primary" className="rounded-2xl" onClick={handleCreateClick}>
              Créer un débat
            </Button>
            <Link
              to="/groups"
              className="tf-interactive-press inline-flex min-h-11 items-center justify-center rounded-2xl border border-tf-dark/15 bg-white px-5 py-2.5 text-sm font-black text-tf-dark"
            >
              Groupes supporters
            </Link>
          </div>
        </Card>
      ) : null}

      <ul className="space-y-4" role="list">
        {all.map((d) => {
          const first = d.previewMessages[0]
          return (
            <li key={d.id}>
              <Card
                elevation="soft"
                className="overflow-hidden border border-orange-200/40 p-0 transition-shadow"
                style={{ ['--debate-accent' as string]: d.accent }}
              >
                <div
                  className="relative px-5 py-5 sm:px-6 sm:py-6"
                  style={{
                    background: `linear-gradient(155deg, ${d.accent} 0%, color-mix(in srgb, ${d.accent} 42%, #0a1628) 52%, #061018 100%)`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                      background: `radial-gradient(ellipse 100% 70% at 15% 0%, #fff, transparent 50%)`,
                    }}
                    aria-hidden
                  />
                  <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {d.leaderboardRank ? <DebateRankBadge rank={d.leaderboardRank} /> : null}
                        {d.groupId ? <DebateGroupBadge groupId={d.groupId} /> : null}
                        {d.trending ? (
                          <span className="inline-flex rounded-full bg-white/18 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white ring-1 ring-white/35">
                            🔥 Top 3
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-2 font-display text-xl font-black leading-[1.18] tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.38),0_1px_2px_rgba(0,0,0,0.55)] sm:text-2xl sm:leading-[1.15]">
                        {d.title}
                      </h2>
                      <p
                        className={cn(
                          'mt-3 max-w-2xl rounded-xl px-3 py-2.5 text-sm font-semibold leading-relaxed text-white',
                          'bg-black/35 ring-1 ring-white/15 backdrop-blur-[2px]',
                          '[text-shadow:0_1px_2px_rgba(0,0,0,0.65)]',
                          'sm:mt-3.5 sm:px-4 sm:py-3 sm:text-[0.9375rem] sm:leading-relaxed',
                        )}
                      >
                        {d.excerpt}
                      </p>
                      <p className="mt-2 text-xs font-bold text-white/92 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                        👥 {d.participantsCount.toLocaleString('fr-FR')} participants · 💬{' '}
                        {d.messagesCount.toLocaleString('fr-FR')} messages
                      </p>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <Link
                        to={debatePageHref(d.id)}
                        className="tf-interactive-press rounded-2xl bg-white px-5 py-2.5 text-center text-sm font-black text-tf-dark shadow-md transition hover:bg-orange-50"
                      >
                        Participer au débat
                      </Link>
                    </div>
                  </div>
                </div>
                {first ? (
                  <div className="border-t border-orange-100/80 bg-gradient-to-b from-orange-50/35 to-white p-5 sm:p-6">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-tf-grey">Aperçu</p>
                    <DebateMessagePreview message={first} compact />
                  </div>
                ) : null}
              </Card>
            </li>
          )
        })}
      </ul>

      <CreateDebateHubModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        canCreateDebate={canAddDebate}
        onBlockedCreate={openLimitPopup}
      />

      <TribuneLimitPopup
        open={limitPopupOpen}
        kind="debate"
        tier={tier}
        onClose={() => setLimitPopupOpen(false)}
        myTribunes={myJoinedGroups}
        orphanJoinedIds={orphanJoinedGroupIds}
        joinedCount={groupLimits.joined}
        maxJoined={groupLimits.maxJoined ?? 5}
      />
    </div>
  )
}
