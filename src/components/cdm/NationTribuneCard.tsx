import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { nationSupporterGroupId } from '../../data/nationSupporterGroups'
import type { Nation } from '../../data/nations'
import { useAuth } from '../../contexts/AuthContext'
import { useSupporterGroups } from '../../hooks/useSupporterGroups'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { cn } from '../../utils/cn'

export function NationTribuneCard({ nation }: { nation: Nation }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { byId, isJoined, joinGroup } = useSupporterGroups()
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  const groupId = nationSupporterGroupId(nation.iso)
  const group = byId(groupId)
  const member = isJoined(groupId)
  const groupPath = `/group/${encodeURIComponent(groupId)}`

  const handleJoin = useCallback(async () => {
    if (!user || user.isAnonymous) {
      navigate('/login', { state: { from: groupPath } })
      return
    }
    setJoinError(null)
    setJoining(true)
    const result = await joinGroup(groupId)
    setJoining(false)
    if (result.ok) {
      navigate(groupPath)
      return
    }
    setJoinError(result.reason)
  }, [user, navigate, joinGroup, groupId, groupPath])

  return (
    <article
      className="relative overflow-hidden rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface px-4 py-5 shadow-tf-elev-1"
      style={{
        borderColor: `${nation.accent}55`,
        background: `linear-gradient(145deg, ${nation.primary}18 0%, transparent 55%), var(--tf-c30-surface, #0f172a)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-25 blur-2xl"
        style={{ backgroundColor: nation.primary }}
        aria-hidden
      />
      <div className="relative space-y-3">
        <div className="flex items-start gap-3">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-2xl shadow-inner"
            aria-hidden
          >
            {nation.flag}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-tf-cdm-gold">
              Tribune publique
            </p>
            <h2 className="font-display text-lg font-black tracking-tight text-tf-app-fg sm:text-xl">
              Tribune {nation.nameFr}
            </h2>
            <p className="mt-1 text-sm font-medium leading-snug text-tf-app-muted">
              Débats, pronos et chants entre supporters {nation.nameFr} pendant la CDM 2026.
            </p>
          </div>
        </div>

        {group ? (
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-tf-app-muted">
            <span className="rounded-full border border-tf-c30-border bg-white/[0.04] px-2.5 py-1">
              {group.members} membre{group.members > 1 ? 's' : ''}
            </span>
            {(group.onlineNow ?? 0) > 0 ? (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
                {group.onlineNow} en ligne
              </span>
            ) : null}
            <span className="rounded-full border border-tf-c30-border bg-white/[0.04] px-2.5 py-1">
              {group.channels.length} salons
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          {member ? (
            <Link
              to={groupPath}
              className={cn(
                'inline-flex min-h-tf-touch flex-1 items-center justify-center rounded-2xl bg-tf-cdm-gold px-4 text-sm font-black text-tf-cdm-deep shadow-tf-elev-1 transition hover:bg-tf-cdm-gold/90',
                TF_FOCUS_VISIBLE,
              )}
            >
              Ouvrir la tribune →
            </Link>
          ) : (
            <button
              type="button"
              disabled={joining}
              onClick={() => void handleJoin()}
              className={cn(
                'inline-flex min-h-tf-touch flex-1 items-center justify-center rounded-2xl px-4 text-sm font-black text-white shadow-tf-elev-1 transition hover:brightness-110 disabled:opacity-60',
                TF_FOCUS_VISIBLE,
              )}
              style={{
                background: `linear-gradient(135deg, ${nation.primary}, ${nation.secondary})`,
              }}
            >
              {joining ? 'Inscription…' : 'Rejoindre la tribune'}
            </button>
          )}
          <Link
            to={groupPath}
            className={cn(
              'inline-flex min-h-tf-touch flex-1 items-center justify-center rounded-2xl border border-tf-c30-border bg-white/[0.04] px-4 text-sm font-bold text-tf-app-fg transition hover:border-tf-cdm-gold/50 hover:text-tf-cdm-gold',
              TF_FOCUS_VISIBLE,
            )}
          >
            {member ? 'Salons' : 'Découvrir'}
          </Link>
        </div>

        {joinError ? (
          <p className="text-xs font-semibold text-amber-300" role="alert">
            {joinError}
          </p>
        ) : null}
      </div>
    </article>
  )
}
