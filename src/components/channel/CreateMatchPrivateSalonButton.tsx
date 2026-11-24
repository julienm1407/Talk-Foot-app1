import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import type { Match } from '../../types/match'
import { useSupporterGroups } from '../../hooks/useSupporterGroups'
import { useAuth } from '../../contexts/AuthContext'
import { tribuneShareUrl } from '../../utils/tribuneShareLinks'
import { cn } from '../../utils/cn'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'

export function CreateMatchPrivateSalonButton({
  match,
  light,
  compact,
}: {
  match: Match
  light: boolean
  compact?: boolean
}) {
  const { user } = useAuth()
  const { createGroup } = useSupporterGroups()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const onCreate = async () => {
    if (busy) return
    if (!user?.id || user.isAnonymous) {
      navigate(`/login?next=${encodeURIComponent(`/channel/${match.id}`)}`)
      return
    }
    setBusy(true)
    setHint(null)
    const res = await createGroup({
      name: `Salon ${match.home.shortName}–${match.away.shortName}`,
      emoji: '🔒',
      motto: 'Salon privé pour ce match',
      location: 'Invitation',
      theme: {
        primary: match.home.colors.primary,
        secondary: match.away.colors.primary,
        background: 'smoke',
      },
      members: 1,
      intensity: 40,
      channels: [{ id: 'general', name: 'Général', description: 'Entre potes', emoji: '💬' }],
      groupKind: 'private',
      linkedMatchId: match.id,
      fanTags: { leagueIds: [match.competition.id], clubIds: [match.home.id, match.away.id] },
    })
    setBusy(false)
    if (!res.ok) {
      setHint(res.reason)
      return
    }
    const invite = tribuneShareUrl(match.id, 'share_tribune').replace(
      `/channel/${encodeURIComponent(match.id)}`,
      `/group/${encodeURIComponent(res.group.id)}`,
    )
    try {
      await navigator.clipboard.writeText(invite)
    } catch {
      /* ignore */
    }
    navigate(`/group/${res.group.id}`)
  }

  const portalRoot = hint && compact ? getModalPortalRoot() : null

  return (
    <div className="relative z-30 shrink-0">
      <button
        type="button"
        disabled={busy}
        onClick={() => void onCreate()}
        title="Créer un salon privé pour ce match"
        aria-label="Créer un salon privé pour ce match"
        className={cn(
          'touch-manipulation rounded-full font-black',
          compact
            ? 'inline-flex size-10 items-center justify-center border'
            : 'px-3 py-1.5 text-[11px]',
          light
            ? compact
              ? 'border-slate-300 bg-white text-slate-800'
              : 'bg-slate-900 text-white'
            : compact
              ? 'border-white/35 bg-[#102f4d] text-sky-50'
              : 'bg-white/15 text-sky-50',
          busy && 'opacity-50',
        )}
      >
        {compact ? (
          <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        ) : (
          'Créer mon salon pour ce match'
        )}
      </button>
      {hint && !compact ? <p className="mt-1 text-[10px] font-semibold text-rose-300">{hint}</p> : null}
      {hint && compact && portalRoot
        ? createPortal(
            <div
              className="pointer-events-auto fixed inset-x-4 bottom-[calc(var(--tf-sys-bottom-inset,0px)+6.5rem)] z-[2147482960] rounded-xl border border-rose-300/40 bg-[#1a0b12] px-3 py-2 text-center text-[12px] font-semibold text-rose-100 shadow-lg"
              role="status"
            >
              {hint}
            </div>,
            portalRoot,
          )
        : null}
    </div>
  )
}
