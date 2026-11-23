import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Match } from '../../types/match'
import { useSupporterGroups } from '../../hooks/useSupporterGroups'
import { useAuth } from '../../contexts/AuthContext'
import { tribuneShareUrl } from '../../utils/tribuneShareLinks'
import { cn } from '../../utils/cn'

export function CreateMatchPrivateSalonButton({ match, light }: { match: Match; light: boolean }) {
  const { user } = useAuth()
  const { createGroup } = useSupporterGroups()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const onCreate = async () => {
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

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void onCreate()}
        className={cn(
          'rounded-full px-3 py-1.5 text-[11px] font-black',
          light ? 'bg-slate-900 text-white' : 'bg-white/15 text-sky-50',
        )}
      >
        Créer mon salon pour ce match
      </button>
      {hint ? <p className="mt-1 text-[10px] font-semibold text-rose-300">{hint}</p> : null}
    </div>
  )
}
