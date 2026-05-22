import { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { Debate } from '../../data/debates'
import { useDebates } from '../../contexts/DebatesContext'
import { containsBannedWord } from '../../utils/bannedWords'
import { cn } from '../../utils/cn'

type Tab = 'browse' | 'create'

export function DebatePickerModal({
  open,
  customForGroup,
  onClose,
  onPick,
  onPublishCustom,
}: {
  open: boolean
  customForGroup: Debate[]
  onClose: () => void
  onPick: (debateId: string) => void
  onPublishCustom: (input: {
    title: string
    excerpt: string
    accent: string
  }) => Debate | null
}) {
  const [tab, setTab] = useState<Tab>('browse')
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [accent, setAccent] = useState('#6366f1')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTab('browse')
    setTitle('')
    setExcerpt('')
    setAccent('#6366f1')
    setFormError(null)
  }, [open])

  const { debates: catalogDebates } = useDebates()

  if (!open) return null

  const catalog = catalogDebates

  const submitCreate = () => {
    setFormError(null)
    const t = title.trim()
    if (t.length < 4) {
      setFormError('Titre d’au moins 4 caractères.')
      return
    }
    if (t.length > 120) {
      setFormError('Titre trop long (120 max).')
      return
    }
    if (containsBannedWord(t)) {
      setFormError('Ce titre contient des propos inappropriés.')
      return
    }
    const ex = excerpt.trim()
    if (ex.length > 280) {
      setFormError('Description trop longue (280 max).')
      return
    }
    if (ex && containsBannedWord(ex)) {
      setFormError('La description contient des propos inappropriés.')
      return
    }
    const d = onPublishCustom({ title: t, excerpt: ex, accent })
    if (!d) {
      setFormError('Impossible d’enregistrer. Réessaie.')
      return
    }
    onPick(d.id)
    onClose()
  }

  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => {
        setTab(id)
        setFormError(null)
      }}
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

  return (
    <div
      className="fixed inset-0 z-[90] overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch]"
      data-no-swipe="true"
      data-tf-modal="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="debate-picker-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fermer"
      />
      <div className="relative z-10 mx-auto w-full max-w-[min(100%,26rem)] px-4 py-8 pb-[max(2rem,calc(2rem+env(safe-area-inset-bottom)))] sm:py-10">
        <Card className="relative max-h-[min(88vh,36rem)] overflow-hidden p-4 sm:max-h-[min(85vh,40rem)] sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Salon général</p>
              <h2 id="debate-picker-title" className="mt-1 text-lg font-black text-slate-900">
                Débat dans le groupe
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Lie un sujet du catalogue, reprends un tien, ou publie le tien.
              </p>
            </div>
            <Button variant="ghost" className="h-9 shrink-0 rounded-2xl" onClick={onClose}>
              Fermer
            </Button>
          </div>

          <div className="mt-4 flex gap-2">
            {tabBtn('browse', 'Parcourir / lier')}
            {tabBtn('create', 'Publier le mien')}
          </div>

          {tab === 'create' ? (
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Titre du débat *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. : On garde ce coach jusqu’en juin ?"
                  className="mt-1"
                  maxLength={120}
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
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-violet-500/35"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Couleur du bandeau</span>
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white"
                  aria-label="Couleur d’accent"
                />
                <Input
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
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
              >
                Publier et lier au salon
              </Button>
              <p className="text-[11px] font-semibold text-slate-500">
                Enregistré sur cet appareil — lié à ce salon uniquement.
              </p>
            </div>
          ) : (
            <div className="mt-4 max-h-[min(52vh,26rem)] space-y-4 overflow-y-auto pr-1">
              {customForGroup.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-violet-700">
                    Tes sujets dans ce groupe
                  </p>
                  <ul className="space-y-2" role="list">
                    {customForGroup.map((d) => (
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
                </div>
              ) : null}
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Catalogue Talk Foot
                </p>
                <ul className="space-y-2" role="list">
                  {catalog.map((d) => (
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
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
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
      <span className="mt-0.5 line-clamp-2 text-xs font-semibold text-slate-500">{debate.excerpt}</span>
    </button>
  )
}
