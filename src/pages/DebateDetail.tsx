import { Link, Navigate, useParams } from 'react-router-dom'
import { useDebates } from '../contexts/DebatesContext'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { fetchDebateById } from '../lib/supabase/debates'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import type { Debate } from '../data/debates'
import { Button } from '../components/ui/Button'
import { cn } from '../utils/cn'
import { getAppSectionTheme } from '../theme/appSectionThemes'
import { DebateSalonPanel } from '../components/debate/DebateSalonPanel'
import { DebateGroupBadge } from '../components/debate/DebateGroupBadge'

export function DebateDetailPage() {
  const { debateId } = useParams()
  const { getDebateById, refresh } = useDebates()
  const [debate, setDebate] = useState<Debate | undefined>(
    debateId ? getDebateById(debateId) : undefined,
  )
  const [loading, setLoading] = useState(Boolean(debateId && !debate))

  useEffect(() => {
    if (!debateId) {
      setDebate(undefined)
      setLoading(false)
      return
    }
    const cached = getDebateById(debateId)
    if (cached) {
      setDebate(cached)
      setLoading(false)
      return
    }
    if (!isSupabaseConfigured()) {
      setDebate(undefined)
      setLoading(false)
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void fetchDebateById(sb, debateId).then((row) => {
      if (!cancelled) {
        setDebate(row)
        setLoading(false)
        if (row) void refresh()
      }
    })
    return () => {
      cancelled = true
    }
  }, [debateId, getDebateById, refresh])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm font-semibold text-tf-grey">Chargement du débat…</p>
      </div>
    )
  }

  if (!debate) {
    return <Navigate to="/debates" replace />
  }

  const dth = getAppSectionTheme('debates')
  const linkedGroupId = debate.groupId?.trim() || null

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 max-lg:overflow-hidden lg:space-y-6',
      )}
      data-no-swipe="true"
    >
      <div className="hidden flex-wrap items-center gap-3 text-sm font-bold lg:flex">
        <Link to="/" className="text-tf-grey hover:text-tf-dark">
          Accueil
        </Link>
        <span className="text-tf-grey-pastel">/</span>
        <Link
          to="/debates"
          className={cn('text-tf-grey hover:text-tf-dark', dth.page.eyebrowClass, 'hover:underline')}
        >
          Débats
        </Link>
        <span className="text-tf-grey-pastel">/</span>
        <span className="truncate text-tf-dark">Fil</span>
      </div>

      <header
        className="shrink-0 overflow-hidden rounded-2xl border border-orange-200/40 shadow-tf-card max-lg:rounded-xl"
        style={{ ['--debate-accent' as string]: debate.accent }}
      >
        <div
          className="relative px-4 py-4 sm:px-6 sm:py-6 max-lg:py-3.5"
          style={{
            background: `linear-gradient(155deg, ${debate.accent} 0%, color-mix(in srgb, ${debate.accent} 42%, #0a1628) 52%, #061018 100%)`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              background: `radial-gradient(ellipse 100% 70% at 15% 0%, #fff, transparent 50%)`,
            }}
            aria-hidden
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              {debate.trending ? (
                <span className="inline-flex rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white ring-1 ring-white/35">
                  🔥 Tendance
                </span>
              ) : null}
              <span className="inline-flex rounded-full bg-emerald-500/25 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white ring-1 ring-emerald-300/40">
                Ouvert à tous
              </span>
              {linkedGroupId ? <DebateGroupBadge groupId={linkedGroupId} /> : null}
            </div>
            <h1 className="mt-2 font-display text-xl font-black leading-[1.15] tracking-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.55)] max-lg:line-clamp-3 sm:mt-3 sm:text-3xl sm:leading-[1.12]">
              {debate.title}
            </h1>
            <p
              className={cn(
                'mt-3 max-w-2xl rounded-xl px-3 py-2.5 text-sm font-semibold leading-relaxed text-white',
                'bg-black/35 ring-1 ring-white/15 backdrop-blur-[2px]',
                '[text-shadow:0_1px_2px_rgba(0,0,0,0.65)]',
                'sm:mt-3.5 sm:px-4 sm:py-3 sm:text-[0.9375rem] sm:leading-relaxed',
              )}
            >
              {debate.excerpt}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black sm:text-sm">
              <span className="rounded-xl border border-white/30 bg-white/14 px-3 py-1.5 text-white/95 backdrop-blur-sm sm:px-4 sm:py-2">
                👥 {debate.participantsCount.toLocaleString('fr-FR')} participants
              </span>
              <span className="rounded-xl border border-white/30 bg-white/14 px-3 py-1.5 text-white/95 backdrop-blur-sm sm:px-4 sm:py-2">
                💬 {debate.messagesCount.toLocaleString('fr-FR')} messages
              </span>
            </div>
          </div>
        </div>
      </header>

      <DebateSalonPanel debate={debate} className="min-h-0 flex-1" />

      <div className="hidden shrink-0 flex-wrap justify-center gap-3 lg:flex">
        <Link to="/debates">
          <Button variant="soft" className="tf-interactive-press rounded-2xl px-5 py-3 text-sm font-black">
            Autres débats
          </Button>
        </Link>
        {linkedGroupId ? (
          <Link to={`/group/${linkedGroupId}`}>
            <Button variant="ghost" className="tf-interactive-press rounded-2xl px-5 py-3 text-sm font-black">
              Voir la tribune liée
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  )
}
