import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import { useLiveMatchTokenEarn } from '../../hooks/useLiveMatchTokenEarn'
import {
  buildPrivateLiveChannelUrl,
  getPrivateLiveEntry,
  isPrivateLiveSalon,
  setPrivateLiveSalon,
} from '../../utils/privateLiveSalon'
import { cn } from '../../utils/cn'

/** Bandeau jetons live + contrôle salon privé (formules). */
export function ChannelSubscriptionExtras({
  matchId,
  isLive,
  light,
}: {
  matchId: string | undefined
  isLive: boolean
  light: boolean
}) {
  const { user } = useAuth()
  const { canCreatePrivateLiveMatches } = useSubscription()
  const { earned, remaining, limit } = useLiveMatchTokenEarn(matchId, isLive)
  const [copyHint, setCopyHint] = useState<string | null>(null)

  const privateOn = useMemo(
    () => (matchId ? isPrivateLiveSalon(matchId) : false),
    [matchId],
  )

  if (!isLive && !canCreatePrivateLiveMatches) return null

  return (
    <div
      className={cn(
        'mb-2 flex min-w-0 flex-col gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-semibold',
        light
          ? 'border-emerald-200/80 bg-emerald-50/90 text-emerald-950'
          : 'border-emerald-500/25 bg-emerald-950/35 text-emerald-100',
      )}
    >
      {isLive && limit > 0 ? (
        <p>
          Jetons live :{' '}
          <span className="font-black tabular-nums">
            {earned}/{limit}
          </span>{' '}
          cette heure
          {remaining > 0 ? (
            <>
              {' '}
              · encore <span className="font-black tabular-nums">{remaining}</span> (1 / 90 s en
              tribune)
            </>
          ) : (
            ' · plafond atteint — repasse à l’heure suivante'
          )}
        </p>
      ) : null}

      {canCreatePrivateLiveMatches && matchId && user?.id ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={cn(
              'rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide transition',
              privateOn
                ? light
                  ? 'border-violet-400 bg-violet-100 text-violet-950'
                  : 'border-violet-400/50 bg-violet-500/20 text-violet-100'
                : light
                  ? 'border-slate-300 bg-white text-slate-800 hover:border-violet-300'
                  : 'border-white/20 bg-white/10 text-sky-100 hover:border-violet-400/40',
            )}
            onClick={() => {
              setPrivateLiveSalon(matchId, user.id, !privateOn)
              window.dispatchEvent(new Event('talkfoot-private-live-changed'))
            }}
          >
            {privateOn ? 'Salon privé actif' : 'Activer salon privé'}
          </button>
          {privateOn ? (
            <button
              type="button"
              className={cn(
                'rounded-md border px-2 py-1 font-bold underline-offset-2 hover:underline',
                light ? 'border-slate-300 text-violet-900' : 'border-white/15 text-violet-200',
              )}
              onClick={async () => {
                const url = buildPrivateLiveChannelUrl(matchId)
                try {
                  await navigator.clipboard.writeText(url)
                  setCopyHint('Lien copié')
                } catch {
                  setCopyHint(url)
                }
                window.setTimeout(() => setCopyHint(null), 2500)
              }}
            >
              Copier lien invité
            </button>
          ) : null}
          {copyHint ? <span className="text-[9px] opacity-90">{copyHint}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

/** Bloque le tchat si salon privé et visiteur sans formule Ambassadeur. */
export function ChannelPrivateSalonGate({
  matchId,
  light,
  children,
}: {
  matchId: string | undefined
  light: boolean
  children: ReactNode
}) {
  const { user } = useAuth()
  const { canCreatePrivateLiveMatches } = useSubscription()
  const [, bump] = useState(0)

  useEffect(() => {
    const fn = () => bump((n) => n + 1)
    window.addEventListener('talkfoot-private-live-changed', fn)
    return () => window.removeEventListener('talkfoot-private-live-changed', fn)
  }, [])

  if (!matchId || !isPrivateLiveSalon(matchId)) {
    return <>{children}</>
  }

  const entry = getPrivateLiveEntry(matchId)
  const isOwner = Boolean(user?.id && entry?.ownerUserId === user.id)
  if (canCreatePrivateLiveMatches || isOwner || user?.isAdmin) {
    return <>{children}</>
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-6 text-center',
        light ? 'border-violet-200 bg-violet-50/90' : 'border-violet-500/30 bg-violet-950/40',
      )}
    >
      <p className="text-sm font-black text-tf-app-fg">Salon live privé</p>
      <p className="mt-2 text-xs font-semibold text-tf-app-muted">
        Cette tribune est réservée aux Ambassadeurs Talk Foot et aux invités du créateur.
      </p>
      <Link
        to="/formules"
        className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white hover:bg-violet-500"
      >
        Voir les formules
      </Link>
    </div>
  )
}
