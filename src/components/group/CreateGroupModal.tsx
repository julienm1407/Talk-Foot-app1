import { useEffect, useMemo, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { cn } from '../../utils/cn'
import { containsBannedWord } from '../../utils/bannedWords'
import type { SupporterGroup } from '../../types/group'
import {
  GROUP_HASHTAG_LIMITS,
  normalizeHashtagList,
  parseHashtagInput,
} from '../../utils/groupHashtags'
import { GroupCard } from './GroupCard'

export function CreateGroupModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (
    g: Omit<SupporterGroup, 'id' | 'createdAt' | 'createdBy'>,
  ) => void
}) {
  const [name, setName] = useState('Mon groupe')
  const [emoji, setEmoji] = useState('🧢')
  const [location, setLocation] = useState('Ma ville')
  const [motto, setMotto] = useState('On vit le foot ensemble.')
  const [primary, setPrimary] = useState('#0b1b3a')
  const [secondary, setSecondary] = useState('#0ea5e9')
  const [background, setBackground] = useState<'clean' | 'smoke' | 'stripe'>(
    'smoke',
  )
  const [nameError, setNameError] = useState<string | null>(null)
  const [groupKind, setGroupKind] = useState<'public' | 'private'>('public')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('Mon groupe')
    setEmoji('🧢')
    setLocation('Ma ville')
    setMotto('On vit le foot ensemble.')
    setPrimary('#0b1b3a')
    setSecondary('#0ea5e9')
    setBackground('smoke')
    setNameError(null)
    setGroupKind('public')
    setHashtags([])
    setTagDraft('')
    setTagError(null)
  }, [open])

  const previewHashtags = useMemo(
    () => normalizeHashtagList([...hashtags, ...parseHashtagInput(tagDraft)]),
    [hashtags, tagDraft],
  )

  const addTagsFromDraft = () => {
    setTagError(null)
    const parsed = parseHashtagInput(tagDraft)
    if (parsed.length === 0) return
    const next = normalizeHashtagList([...hashtags, ...parsed])
    if (next.length > GROUP_HASHTAG_LIMITS.maxTags) {
      setTagError(`Maximum ${GROUP_HASHTAG_LIMITS.maxTags} hashtags.`)
      return
    }
    setHashtags(next)
    setTagDraft('')
  }

  const draft = useMemo<SupporterGroup>(() => {
    return {
      id: 'draft',
      name: name.trim() || 'Mon groupe',
      emoji: emoji.trim() || '🧢',
      location: location.trim() || undefined,
      motto: motto.trim() || 'On vit le foot ensemble.',
      theme: { primary, secondary, background },
      members: Math.round(18 + Math.random() * 60),
      intensity: Math.round(55 + Math.random() * 35),
      groupKind,
      hashtags: previewHashtags.length ? previewHashtags : undefined,
      channels: [
        {
          id: 'general',
          name: 'Général',
          description: 'Débats, ambiance, vie du groupe.',
          emoji: '💬',
        },
        {
          id: 'transferts',
          name: 'Transferts',
          description: 'Rumeurs, mercato, compos.',
          emoji: '🧾',
        },
        {
          id: 'pronos',
          name: 'Pronos',
          description: 'Paris entre supporters, scores.',
          emoji: '🎯',
        },
      ],
      createdBy: 'me',
      createdAt: new Date().toISOString(),
      onlineNow: 1,
      messagesToday: 0,
      lastMessagePreview: 'Crée ton premier message…',
    }
  }, [background, emoji, groupKind, location, motto, name, previewHashtags, primary, secondary])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <Card className="relative w-full max-w-[980px] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/70">
              NOUVEAU GROUPE
            </div>
            <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              Créer un groupe
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-700/70">
              Thème, salons, couleurs — sans logos officiels.
            </div>
          </div>

          <Button variant="ghost" className="h-10 rounded-2xl" onClick={onClose}>
            Fermer
          </Button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4">
            <div className="text-sm font-black text-slate-900">Identité</div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700/70">
                  Nom du groupe
                </label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameError(null)
                  }}
                  className={cn('mt-1', nameError && 'border-rose-500')}
                />
                {nameError && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">
                    {nameError}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700/70">
                  Emoji
                </label>
                <Input
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700/70">
                  Ville (optionnel)
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700/70">
                  Slogan
                </label>
                <Input
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm font-black text-slate-900">Visibilité</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={groupKind === 'public' ? 'primary' : 'soft'}
                    className="h-9 rounded-2xl px-4"
                    onClick={() => {
                      setGroupKind('public')
                      setTagError(null)
                    }}
                    aria-pressed={groupKind === 'public'}
                  >
                    Salon public
                  </Button>
                  <Button
                    type="button"
                    variant={groupKind === 'private' ? 'primary' : 'soft'}
                    className="h-9 rounded-2xl px-4"
                    onClick={() => {
                      setGroupKind('private')
                      setTagError(null)
                    }}
                    aria-pressed={groupKind === 'private'}
                  >
                    Salon privé
                  </Button>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-600">
                  {groupKind === 'public'
                    ? 'Un salon public doit avoir au moins un hashtag : les personnes qui partagent les mêmes centres d’intérêt te retrouvent dans « Tous les salons ».'
                    : 'Les hashtags restent optionnels sur un salon privé.'}
                </p>
              </div>

              <div>
                <label
                  htmlFor="create-group-hashtags"
                  className="text-xs font-bold text-slate-700/70"
                >
                  Centres d’intérêt (hashtags)
                  {groupKind === 'public' ? (
                    <span className="font-black text-rose-600"> *</span>
                  ) : null}
                </label>
                <div className="mt-2 flex min-h-9 flex-wrap gap-2">
                  {hashtags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800"
                    >
                      #{t}
                      <button
                        type="button"
                        className="rounded-full px-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        onClick={() =>
                          setHashtags((prev) => prev.filter((x) => x !== t))
                        }
                        aria-label={`Retirer ${t}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  id="create-group-hashtags"
                  value={tagDraft}
                  onChange={(e) => {
                    setTagDraft(e.target.value)
                    setTagError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addTagsFromDraft()
                    }
                  }}
                  placeholder="Ex : ligue1, pronos, marseille (Entrée pour ajouter)"
                  className={cn('mt-2', tagError && 'border-rose-500')}
                />
                {tagError ? (
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">
                    {tagError}
                  </p>
                ) : null}
                <p className="mt-1.5 text-[11px] font-semibold text-slate-500">
                  Lettres, chiffres, tirets — max {GROUP_HASHTAG_LIMITS.maxTags}{' '}
                  tags, {GROUP_HASHTAG_LIMITS.maxTagLen} caractères chacun.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-black text-slate-900">Thème</div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2">
                  <span className="text-xs font-bold text-slate-700/70">
                    Primaire
                  </span>
                  <input
                    type="color"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="h-7 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white"
                    aria-label="Couleur primaire"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2">
                  <span className="text-xs font-bold text-slate-700/70">
                    Secondaire
                  </span>
                  <input
                    type="color"
                    value={secondary}
                    onChange={(e) => setSecondary(e.target.value)}
                    className="h-7 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white"
                    aria-label="Couleur secondaire"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border-slate-200 bg-white/80 text-slate-900">
                    Fond
                  </Badge>
                  <Button
                    variant={background === 'clean' ? 'primary' : 'soft'}
                    className="h-9 rounded-2xl px-3"
                    onClick={() => setBackground('clean')}
                    aria-pressed={background === 'clean'}
                  >
                    Clean
                  </Button>
                  <Button
                    variant={background === 'smoke' ? 'primary' : 'soft'}
                    className="h-9 rounded-2xl px-3"
                    onClick={() => setBackground('smoke')}
                    aria-pressed={background === 'smoke'}
                  >
                    Smoke
                  </Button>
                  <Button
                    variant={background === 'stripe' ? 'primary' : 'soft'}
                    className="h-9 rounded-2xl px-3"
                    onClick={() => setBackground('stripe')}
                    aria-pressed={background === 'stripe'}
                  >
                    Stripe
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <Button variant="soft" className="rounded-3xl" onClick={onClose}>
                Annuler
              </Button>
              <Button
                variant="primary"
                className="rounded-3xl"
                onClick={() => {
                  setNameError(null)
                  setTagError(null)
                  if (containsBannedWord(draft.name)) {
                    setNameError('Ce nom contient des propos inappropriés. Choisis un autre nom.')
                    return
                  }
                  const finalTags = normalizeHashtagList([
                    ...hashtags,
                    ...parseHashtagInput(tagDraft),
                  ])
                  if (groupKind === 'public' && finalTags.length === 0) {
                    setTagError(
                      'Ajoute au moins un hashtag pour que les autres trouvent ton salon public.',
                    )
                    return
                  }
                  for (const t of finalTags) {
                    if (containsBannedWord(t)) {
                      setTagError(
                        'Un hashtag contient des propos inappropriés. Modifie-le.',
                      )
                      return
                    }
                  }
                  onCreate({
                    name: draft.name,
                    emoji: draft.emoji,
                    location: draft.location,
                    motto: draft.motto,
                    theme: draft.theme,
                    members: draft.members,
                    intensity: draft.intensity,
                    channels: draft.channels,
                    groupKind,
                    hashtags: finalTags.length > 0 ? finalTags : undefined,
                  })
                  onClose()
                }}
              >
                Créer le groupe
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4">
            <div className="text-sm font-black text-slate-900">Aperçu</div>
            <div className="mt-3">
              <GroupCard group={draft} />
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-700/70">
              Tu peux modifier ces paramètres quand tu veux (mock).
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

