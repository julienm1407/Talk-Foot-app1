import { Link, Navigate, useParams } from 'react-router-dom'
import { useDebates } from '../contexts/DebatesContext'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { fetchDebateById } from '../lib/supabase/debates'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import type { Debate } from '../data/debates'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { DebateMessagePreview } from '../components/debate/DebateMessagePreview'
import { cn } from '../utils/cn'
import { getAppSectionTheme } from '../theme/appSectionThemes'
import { AdSlot } from '../components/ui/AdSlot'
import { EditorialProse } from '../components/ads/EditorialProse'

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
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
        className="overflow-hidden rounded-2xl border border-orange-200/40 shadow-tf-card"
        style={{ ['--debate-accent' as string]: debate.accent }}
      >
        <div
          className="relative px-4 py-5 sm:px-6 sm:py-6"
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
            {debate.trending ? (
              <span className="inline-flex rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white ring-1 ring-white/35">
                🔥 Tendance
              </span>
            ) : null}
            <h1 className="mt-3 font-display text-2xl font-black leading-[1.15] tracking-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.55)] sm:text-3xl sm:leading-[1.12]">
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

      <EditorialProse
        title="Contexte du débat"
        className="border-orange-200/35 bg-orange-50/50"
        paragraphs={[
          `Ce fil rassemble les arguments des supporters autour de « ${debate.title} ». Les extraits ci-dessous proviennent de la communauté Talk Foot ; la discussion complète se poursuit dans la tribune de groupe associé.`,
          'Talk Foot propose des débats modérés, des sondages et des tribunes live par match. Les pages de simple navigation (liste des débats, calendrier, connexion) restent sans publicité.',
        ]}
      />

      <AdSlot
        compact
        tone="navy"
        brand="Talk Foot"
        body="Espace partenaire sur la page débat."
        imageSeed="debate-inline"
        contentReady
      />

      <Card className="p-5 sm:p-6" elevation="soft">
        <h2 className="font-display text-sm font-black uppercase tracking-[0.18em] text-tf-grey">
          Aperçu des messages
        </h2>
        <ul className="mt-4 space-y-3" role="list">
          {debate.previewMessages.map((m, i) => (
            <li key={`${debate.id}-pv-${i}`}>
              <DebateMessagePreview message={m} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs font-semibold text-tf-grey">
          La suite de la discussion se poursuit dans la tribune groupe — réactions, sondages et modération.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/group/${debate.groupId}?debate=${encodeURIComponent(debate.id)}`}>
            <Button variant="primary" className="tf-interactive-press rounded-2xl px-6 py-3 text-sm font-black">
              💬 Écrire dans la tribune
            </Button>
          </Link>
          <Link to="/debates">
            <Button variant="soft" className="tf-interactive-press rounded-2xl px-5 py-3 text-sm font-black">
              Autres débats
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
