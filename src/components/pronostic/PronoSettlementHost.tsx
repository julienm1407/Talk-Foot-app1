import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useUserBets } from '../../hooks/useUserBets'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { fireImmediateMatchNotification, isNativePushRuntime } from '../../lib/push/nativeMatchPush'
import type { Bet } from '../../types/bet'
import { getBetMatchFixtureLabel } from '../../utils/betDisplay'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { cn } from '../../utils/cn'

const SEEN_KEY = 'talkfoot.pronoSettlementSeen.v1'

function readSeen(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY)
    const arr = raw ? (JSON.parse(raw) as string[]) : []
    return new Set(arr)
  } catch {
    return new Set()
  }
}

function writeSeen(ids: Set<string>) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-80)))
  } catch {
    /* ignore */
  }
}

export function PronoSettlementHost() {
  const [bets] = useUserBets()
  const { myRank } = useLeaderboard()
  const { pronoResultAlertsEnabled } = useFanPreferences()
  const primed = useRef(false)
  const seenRef = useRef<Set<string>>(new Set())
  const [card, setCard] = useState<Bet | null>(null)

  useEffect(() => {
    seenRef.current = readSeen()
    primed.current = true
  }, [])

  useEffect(() => {
    if (!primed.current) return
    const fresh = bets.filter(
      (b) =>
        (b.status === 'won' || b.status === 'lost') &&
        b.settledAt &&
        Date.now() - Date.parse(b.settledAt) < 36 * 60 * 60 * 1000 &&
        !seenRef.current.has(b.id),
    )
    const next = fresh[0]
    if (!next) return
    seenRef.current.add(next.id)
    writeSeen(seenRef.current)
    setCard(next)
    if (pronoResultAlertsEnabled && isNativePushRuntime()) {
      const label = getBetMatchFixtureLabel(null, next)
      const tokens = next.status === 'won' ? Math.round(next.payout ?? 0) : 0
      const body =
        next.status === 'won'
          ? `Ton prono a gagné ✅ +${tokens} jetons · tu passes ${myRank}e`
          : 'Ton prono a perdu… revanche au prochain match ?'
      void fireImmediateMatchNotification({
        idKey: `prono-${next.id}`,
        title: label,
        body,
        href: '/pronostic',
      })
    }
  }, [bets, myRank, pronoResultAlertsEnabled])

  if (!card) return null
  const portal = getModalPortalRoot()
  if (!portal) return null
  const won = card.status === 'won'
  const tokens = Math.round(card.payout ?? 0)
  const label = getBetMatchFixtureLabel(null, card)

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-[70] flex justify-center px-3 sm:bottom-8">
      <div
        className={cn(
          'pointer-events-auto w-full max-w-md rounded-2xl border p-4 shadow-2xl',
          won
            ? 'border-emerald-400/40 bg-[#06281c] text-emerald-50'
            : 'border-rose-400/35 bg-[#2a1018] text-rose-50',
        )}
        role="status"
      >
        <p className="text-sm font-black">
          {won
            ? `Prono gagné ✅${tokens > 0 ? ` +${tokens} jetons` : ''} · tu passes ${myRank}e`
            : 'Prono perdu ❌ · revanche au prochain match'}
        </p>
        <p className="mt-1 text-xs font-semibold opacity-80">{label}</p>
        <div className="mt-3 flex gap-2">
          <Link
            to="/pronostic?vue=classement"
            className="rounded-xl bg-white/15 px-3 py-2 text-xs font-black"
            onClick={() => setCard(null)}
          >
            Classement
          </Link>
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-xs font-bold opacity-80"
            onClick={() => setCard(null)}
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    portal,
  )
}
