import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { Debate } from '../../data/debates'
import { useDebates } from '../../contexts/DebatesContext'
import { MODERATION_REFUSED_MESSAGE_FR, moderateDebateInput } from '../../utils/bannedWords'
import { mergeDebatesForGroup } from '../../utils/mergeGroupDebates'
import { cn } from '../../utils/cn'

type Tab = 'browse' | 'create'

export function DebatePickerModal({
  open,
  groupId,
  customForGroup,
  canCreateDebate = true,
  onClose,
  onPick,
  onPublishCustom,
  onBlockedCreate,
}: {
  open: boolean
  groupId: string
  customForGroup: Debate[]
  /** Formule + quota : false pour Supporter ou quota épuisé. */
  canCreateDebate?: boolean
  onClose: () => void
  onPick: (debateId: string) => void
  onPublishCustom: (input: {
    title: string
    excerpt: string
    accent: string
  }) => Debate | null
  onBlockedCreate?: () => void
}) {
  const [tab, setTab] = useState<Tab>('browse')
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [accent, setAccent] = useState('#6366f1')
  const [formError, setFormError] = useState<string | null>(null)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  const { debates: catalogDebates, refresh, loading } = useDebates()

  const groupDebates = useMemo(
    () => mergeDebatesForGroup(catalogDebates, customForGroup, groupId),
    [catalogDebates, customForGroup, groupId],
  )

  useLayoutEffect(() => {
    setPortalTarget(document.body)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setTab('browse')
    setTitle('')
    setExcerpt('')
    setAccent('#6366f1')
    setFormError(null)
    void refresh()
  }, [open, refresh])

  if (!open || !portalTarget) return null

  const submitCreate = () => {
    setFormError(null)
    if (!canCreateDebate) {
      onBlockedCreate?.()
      return
    }
    const t = title.trim()
    if (t.length < 4) {
      setFormError('Titre d’au moins 4 caractères.')
      return
    }
    if (t.length > 120) {
      setFormError('Titre trop long (120 max).')
      return
    }
    const moderation = moderateDebateInput({ title: t, excerpt: excerpt.trim() || undefined })
    if (!moderation.ok) {
      setFormError(moderation.message || MODERATION_REFUSED_MESSAGE_FR)
      return
    }
    const ex = excerpt.trim()
    if (ex.length > 280) {
      setFormError('Description trop longue (280 max).')
      return
    }
    const d = onPublishCustom({ title: t, excerpt: ex, accent })
    if (!d) {
      onBlockedCreate?.()
      return
    }
    onPick(d.id)
    onClose()
  }

  const selectTab = (id: Tab) => {
    if (id === 'create' && !canCreateDebate) {
      setTab('create')
      setFormError(null)
      onBlockedCreate?.()
      return
    }
    setTab(id)
    setFormError(null)
  }

  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => selectTab(id)}
      className={cn(
        'min-h-10 flex-1 rounded-2xl px-3 py-2 text-center text-xs font-black transition sm:text-sm',
        tab === id
          ? 'bg-violet-600 text-white shadow-sm'
          : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
      )}
    >
      {label}
    </button>
  )

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[280] grid w-full place-items-center overflow-hidden',
        'h-[100dvh] max-h-[100dvh]',
        'p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]',
      )}
      data-no-swipe="true"
      data-tf-modal="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="debate-picker-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fermer"
      />
      <Card className="relative z-10 flex max-h-[min(calc(100dvh-2rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)),40rem)] w-full max-w-[min(100%,26rem)] flex-col overflow-hidden p-4 sm:p-5">
        <div className="shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tribune général</p>
              <h2 id="debate-picker-title" className="mt-1 text-lg font-black text-slate-900">
                Débat dans le groupe
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Sujets publiés dans ce groupe — visibles par tous les membres.
              </p>
            </div>
            <Button variant="ghost" className="h-9 shrink-0 rounded-2xl" onClick={onClose}>
              Fermer
            </Button>
          </div>

          <div className="mt-4 flex gap-2">
            {tabBtn('browse', `Parcourir (${groupDebates.length})`)}
            {tabBtn('create', 'Publier le mien')}
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          {tab === 'create' ? (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              {!canCreateDebate ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-left">
                  <p className="text-sm font-black text-amber-950">Publication indisponible</p>
                  <p className="mt-1 text-xs font-semibold text-amber-900/90">
                    Vérifie ta formule ou ton quota de débats — une fenêtre d’info s’affiche au-dessus.
                  </p>
                  <Button
                    type="button"
                    variant="soft"
                    className="mt-3 w-full rounded-2xl font-black"
                    onClick={() => onBlockedCreate?.()}
                  >
                    Voir les limites
                  </Button>
                </div>
              ) : null}
              <div>
                <label className="text-xs font-bold text-slate-700">Titre du débat *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. : On garde ce coach jusqu’en juin ?"
                  className="mt-1"
                  maxLength={120}
                  disabled={!canCreateDebate}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Description (optionnel)</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Pose le contexte en une ou deux phrases…"
                  rows={3}
                  maxLength={280}
                  disabled={!canCreateDebate}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-violet-500/35 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Couleur du bandeau</span>
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  disabled={!canCreateDebate}
                  className="h-9 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Couleur d’accent"
                />
                <Input
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  disabled={!canCreateDebate}
                  className="max-w-[7.5rem] font-mono text-xs"
                  aria-label="Couleur en hex"
                />
              </div>
              {formError ? <p className="text-xs font-semibold text-rose-600">{formError}</p> : null}
              <Button
                type="button"
                variant="primary"
                className="w-full rounded-2xl font-black"
                onClick={submitCreate}
                disabled={!canCreateDebate}
              >
                Publier et lier à la tribune
              </Button>
              <p className="text-[11px] font-semibold text-slate-500">
                Partagé avec le groupe dès publication (base Talk Foot).
              </p>
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {loading ? (
                <p className="text-sm font-semibold text-slate-500">Chargement des débats…</p>
              ) : groupDebates.length > 0 ? (
                <ul className="space-y-2" role="list">
                  {groupDebates.map((d) => (
                    <li key={d.id}>
                      <DebateRow
                        debate={d}
                        onSelect={() => {
                          onPick(d.id)
                          onClose()
                        }}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-center">
                  <p className="text-sm font-black text-slate-800">Aucun débat dans ce groupe</p>
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    Publie le tien ou demande à ton ami de le lier à la tribune générale — il apparaîtra ici pour
                    tout le monde.
                  </p>
                  <Button
                    type="button"
                    variant="soft"
                    className="mt-3 w-full rounded-2xl font-black"
                    onClick={() => selectTab('create')}
                  >
                    Publier le mien
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>,
    portalTarget,
  )
}

function DebateRow({ debate, onSelect }: { debate: Debate; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 text-left transition hover:border-violet-300 hover:bg-violet-50/50"
    >
      <span className="line-clamp-2 text-sm font-black text-slate-900">{debate.title}</span>
      <span className="mt-0.5 line-clamp-2 text-xs font-semibold text-slate-600">{debate.excerpt}</span>
      {(debate.messagesCount ?? 0) > 0 ? (
        <span className="mt-1 inline-block text-[10px] font-bold text-violet-700">
          {debate.messagesCount} message{debate.messagesCount === 1 ? '' : 's'}
        </span>
      ) : null}
    </button>
  )
}
