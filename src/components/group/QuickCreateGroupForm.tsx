import { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { cn } from '../../utils/cn'
import { containsBannedWord } from '../../utils/bannedWords'
import type { SupporterGroup } from '../../types/group'
import {
  GROUP_HASHTAG_LIMITS,
  normalizeHashtagList,
  parseHashtagInput,
} from '../../utils/groupHashtags'
import type { GroupTheme } from '../../types/group'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'

const DEFAULT_CHANNELS = [
  { id: 'general', name: 'Général', description: 'Débats, ambiance.', emoji: '💬' },
  { id: 'transferts', name: 'Transferts', description: 'Rumeurs, mercato.', emoji: '🧾' },
  { id: 'pronos', name: 'Pronos', description: 'Paris entre supporters.', emoji: '🎯' },
]

const EMOJI_SUGGESTIONS = [
  { emoji: '⚽', label: 'Foot' },
  { emoji: '🏆', label: 'Trophée' },
  { emoji: '🔥', label: 'Flame' },
  { emoji: '👏', label: 'Bravo' },
  { emoji: '❤️', label: 'Cœur' },
  { emoji: '⭐', label: 'Étoile' },
  { emoji: '👑', label: 'Couronne' },
  { emoji: '💪', label: 'Muscle' },
  { emoji: '🎉', label: 'Fête' },
  { emoji: '🧢', label: 'Casquette' },
  { emoji: '🔵', label: 'Bleu' },
  { emoji: '🔴', label: 'Rouge' },
  { emoji: '🎯', label: 'Cible' },
  { emoji: '💥', label: 'Boom' },
  { emoji: '🥅', label: 'Cage' },
  { emoji: '🌙', label: 'Lune' },
]

export function QuickCreateGroupForm({
  onCreate,
}: {
  onCreate: (g: Omit<SupporterGroup, 'id' | 'createdAt' | 'createdBy'>) => void
}) {
  const { preferencesComplete, favoriteLeagueId, favoriteClubIds } = useFanPreferences()
  const [name, setName] = useState('')
  const [emojis, setEmojis] = useState<string[]>(['⚽'])
  const [primary, setPrimary] = useState('#011e33')
  const [secondary, setSecondary] = useState('#5d86a2')
  const [background, setBackground] = useState<GroupTheme['background']>('smoke')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hashtags, setHashtags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleEmoji = (e: string) => {
    setEmojis((prev) => {
      if (prev.includes(e)) return prev.filter((x) => x !== e)
      if (prev.length >= 3) return [...prev.slice(0, 2), e]
      return [...prev, e]
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setTagError(null)
    const trimmedName = name.trim() || 'Mon groupe'
    if (!trimmedName) return
    if (containsBannedWord(trimmedName)) {
      setError('Ce nom contient des propos inappropriés. Choisis un autre nom.')
      return
    }
    const finalTags = normalizeHashtagList([
      ...hashtags,
      ...parseHashtagInput(tagDraft),
    ])
    if (finalTags.length === 0) {
      setTagError(
        'Ajoute au moins un hashtag : les autres te retrouvent avec les mêmes centres d’intérêt.',
      )
      return
    }
    for (const t of finalTags) {
      if (containsBannedWord(t)) {
        setTagError('Un hashtag contient des propos inappropriés.')
        return
      }
    }
    onCreate({
      name: trimmedName,
      emoji: emojis.join('').trim() || '⚽',
      motto: 'On vit le foot ensemble.',
      theme: { primary, secondary, background },
      members: Math.round(12 + Math.random() * 40),
      intensity: Math.round(50 + Math.random() * 40),
      channels: DEFAULT_CHANNELS,
      groupKind: 'public',
      hashtags: finalTags,
      ...(preferencesComplete &&
        favoriteLeagueId &&
        favoriteClubIds.length > 0 && {
          fanTags: {
            leagueIds: [favoriteLeagueId],
            clubIds: [...favoriteClubIds],
          },
        }),
    })
    setName('')
    setEmojis(['⚽'])
    setPrimary('#011e33')
    setSecondary('#5d86a2')
    setBackground('smoke')
    setHashtags([])
    setTagDraft('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col"
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="quick-name" className="mb-1 block text-xs font-bold text-tf-grey">
            Nom du groupe
          </label>
          <Input
            id="quick-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            placeholder="Ex: Les Ultras 92"
            className={cn('w-full rounded-xl', error && 'border-rose-500')}
          />
          {error && (
            <p className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p>
          )}
        </div>

        <div className="relative" ref={emojiRef}>
          <label className="mb-1 block text-xs font-bold text-tf-grey">
            Emojis représentatifs <span className="font-normal">(max 3)</span>
          </label>
          <button
            type="button"
            onClick={() => setEmojiOpen((o) => !o)}
            className={cn(
              'flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-tf-grey-pastel/50 bg-white px-3 text-left',
              'focus:outline-none focus:ring-2 focus:ring-tf-grey/30',
            )}
          >
            <span className="flex gap-0.5 text-xl">
              {emojis.map((e) => (
                <span key={e} aria-hidden>
                  {e}
                </span>
              ))}
            </span>
            <span className="ml-auto text-xs font-medium text-tf-grey">
              {emojis.length}/3
            </span>
            <svg
              className={cn('size-4 text-tf-grey transition', emojiOpen && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {emojiOpen && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-tf-grey-pastel/50 bg-white p-2 shadow-lg">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_SUGGESTIONS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => toggleEmoji(emoji)}
                    title={label}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg text-xl transition',
                      emojis.includes(emoji)
                        ? 'bg-tf-dark/15 ring-1 ring-tf-dark/30'
                        : 'hover:bg-tf-grey-pastel/40',
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="quick-hashtags"
            className="mb-1 block text-xs font-bold text-tf-grey"
          >
            Hashtags (obligatoire) <span className="font-normal">— mêmes centres d’intérêt</span>
          </label>
          <div className="mb-2 flex min-h-9 flex-wrap gap-2">
            {hashtags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-tf-grey-pastel/60 bg-white px-2 py-0.5 text-xs font-bold text-tf-dark"
              >
                #{t}
                <button
                  type="button"
                  className="rounded-full px-1 text-tf-grey hover:bg-tf-grey-pastel/40"
                  onClick={() => setHashtags((prev) => prev.filter((x) => x !== t))}
                  aria-label={`Retirer ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <Input
            id="quick-hashtags"
            value={tagDraft}
            onChange={(e) => {
              setTagDraft(e.target.value)
              setTagError(null)
            }}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' || ev.key === ',') {
                ev.preventDefault()
                addTagsFromDraft()
              }
            }}
            placeholder="ligue1, pronos… puis Entrée"
            className={cn('w-full rounded-xl', tagError && 'border-rose-500')}
          />
          {tagError ? (
            <p className="mt-1.5 text-xs font-semibold text-rose-600">{tagError}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-bold text-tf-grey">Thème du groupe</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-tf-grey-pastel/50 bg-white px-2 py-1.5">
              <span className="text-[10px] font-bold text-tf-grey">Primaire</span>
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="h-6 w-8 cursor-pointer rounded border border-tf-grey-pastel/50 bg-white"
                aria-label="Couleur primaire"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-tf-grey-pastel/50 bg-white px-2 py-1.5">
              <span className="text-[10px] font-bold text-tf-grey">Secondaire</span>
              <input
                type="color"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="h-6 w-8 cursor-pointer rounded border border-tf-grey-pastel/50 bg-white"
                aria-label="Couleur secondaire"
              />
            </div>
            <div className="flex shrink-0 gap-1">
              {(['clean', 'smoke', 'stripe'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBackground(b)}
                  className={cn(
                    'rounded-lg px-2 py-1 text-[10px] font-bold capitalize transition',
                    background === b
                      ? 'bg-tf-dark text-white'
                      : 'bg-tf-grey-pastel/40 text-tf-grey hover:bg-tf-grey-pastel/60',
                  )}
                >
                  {b === 'clean' ? 'Clean' : b === 'smoke' ? 'Smoke' : 'Stripe'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="mt-2 w-full rounded-xl py-3 font-bold"
          disabled={!name.trim()}
        >
          Créer le groupe
        </Button>
      </div>
    </form>
  )
}
