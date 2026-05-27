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
import { GROUP_THEME_PRESETS } from '../../data/groupThemePresets'
import type { GroupTheme } from '../../types/group'
import { ALL_CLUBS_CATALOG } from '../../data/allClubsCatalog'
import type { ClubCatalogEntry } from '../../data/allClubsCatalog'
import { CONFEDERATIONS, NATIONS } from '../../data/nations'

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
  const [accent, setAccent] = useState('')
  const [intensity, setIntensity] = useState(72)
  const [background, setBackground] = useState<'clean' | 'smoke' | 'stripe'>(
    'smoke',
  )
  const [nameError, setNameError] = useState<string | null>(null)
  const [groupKind, setGroupKind] = useState<'public' | 'private'>('public')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const [affiliationCountry, setAffiliationCountry] = useState('')
  const [affiliationClubId, setAffiliationClubId] = useState('')

  useEffect(() => {
    if (!open) return
    setName('Mon groupe')
    setEmoji('🧢')
    setLocation('Ma ville')
    setMotto('On vit le foot ensemble.')
    setPrimary('#0b1b3a')
    setSecondary('#0ea5e9')
    setAccent('')
    setIntensity(72)
    setBackground('smoke')
    setNameError(null)
    setGroupKind('public')
    setHashtags([])
    setTagDraft('')
    setTagError(null)
    setAffiliationCountry('')
    setAffiliationClubId('')
  }, [open])

  const countrySuggestions = useMemo(
    () =>
      Array.from(
        new Set([
          ...CONFEDERATIONS.map((c) => c.label),
          ...NATIONS.map((n) => n.nameFr),
          'International',
          'Europe',
          'Afrique',
          'Asie',
          'Amérique du Nord',
          'Amérique du Sud',
          'Moyen-Orient',
          'Caraïbes',
        ]),
      ),
    [],
  )

  const clubsByLeague = useMemo(() => {
    const byLeague = new Map<string, { leagueName: string; clubs: ClubCatalogEntry[] }>()
    for (const club of ALL_CLUBS_CATALOG) {
      const found = byLeague.get(club.leagueId)
      if (!found) {
        byLeague.set(club.leagueId, { leagueName: club.leagueName, clubs: [club] })
      } else {
        found.clubs.push(club)
      }
    }
    return Array.from(byLeague.values())
      .map((entry) => ({
        ...entry,
        clubs: [...entry.clubs].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
      }))
      .sort((a, b) => a.leagueName.localeCompare(b.leagueName, 'fr'))
  }, [])

  const selectedClub = useMemo(
    () => ALL_CLUBS_CATALOG.find((club) => club.id === affiliationClubId) ?? null,
    [affiliationClubId],
  )

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

  const draftTheme = useMemo<GroupTheme>(() => {
    const t: GroupTheme = { primary, secondary, background }
    if (accent.trim()) t.accent = accent.trim()
    return t
  }, [accent, background, primary, secondary])

  const draft = useMemo<SupporterGroup>(() => {
    return {
      id: 'draft',
      name: name.trim() || 'Mon groupe',
      emoji: emoji.trim() || '🧢',
      location: location.trim() || undefined,
      motto: motto.trim() || 'On vit le foot ensemble.',
      theme: draftTheme,
      members: 1,
      intensity,
      groupKind,
      hashtags: previewHashtags.length ? previewHashtags : undefined,
      fanTags:
        selectedClub || affiliationCountry.trim()
          ? {
              leagueIds: selectedClub ? [selectedClub.leagueId] : [],
              clubIds: selectedClub ? [selectedClub.id] : [],
              countryLabels: affiliationCountry.trim() ? [affiliationCountry.trim()] : undefined,
            }
          : undefined,
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
      onlineNow: 0,
      messagesToday: 0,
      lastMessagePreview: 'Crée ton premier message…',
    }
  }, [
    draftTheme,
    emoji,
    groupKind,
    intensity,
    location,
    motto,
    name,
    previewHashtags,
    selectedClub,
    affiliationCountry,
  ])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex min-h-0 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch]"
      data-no-swipe="true"
      data-tf-modal="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-group-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fermer la création de groupe"
      />

      <div
        className={cn(
          'relative z-10 mx-auto box-border w-full min-w-0 max-w-full flex-1 px-3 py-4 sm:max-w-tf-modal-wide sm:px-4 sm:py-10',
          'pb-[max(1.5rem,calc(1.5rem+env(safe-area-inset-bottom)))] sm:pb-[max(2rem,calc(2rem+env(safe-area-inset-bottom)))]',
          'pt-[max(0.5rem,env(safe-area-inset-top))] sm:pt-0',
        )}
      >
        <Card className="relative w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 pr-0 sm:min-w-[12rem] sm:flex-1 sm:pr-2">
            <div className="text-[10px] font-black tracking-[0.16em] text-slate-700/70 sm:text-[11px] sm:tracking-[0.18em]">
              NOUVEAU GROUPE
            </div>
            <div
              id="create-group-title"
              className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl"
            >
              Créer un groupe
            </div>
            <div className="mt-1 text-xs font-semibold leading-snug text-slate-700/70 sm:text-sm">
              Thème, tribunes, couleurs — sans logos officiels.
            </div>
          </div>

          <Button
            variant="ghost"
            className="h-10 w-full shrink-0 rounded-2xl sm:w-auto sm:self-start"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/70 p-3 sm:rounded-3xl sm:p-4">
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
                <div className="text-sm font-black text-slate-900">Affiliation supporters</div>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Tu peux rattacher ton groupe à un pays/zone (libre) et à un club de l’appli.
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="create-group-country"
                      className="text-xs font-bold text-slate-700/70"
                    >
                      Pays ou zone
                    </label>
                    <Input
                      id="create-group-country"
                      list="create-group-country-list"
                      value={affiliationCountry}
                      onChange={(e) => setAffiliationCountry(e.target.value)}
                      placeholder="Ex : France, Maghreb, Europe…"
                      className="mt-1"
                    />
                    <datalist id="create-group-country-list">
                      {countrySuggestions.map((country) => (
                        <option key={country} value={country} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label
                      htmlFor="create-group-club"
                      className="text-xs font-bold text-slate-700/70"
                    >
                      Club affilié (optionnel)
                    </label>
                    <select
                      id="create-group-club"
                      value={affiliationClubId}
                      onChange={(e) => setAffiliationClubId(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900"
                    >
                      <option value="">Aucun club spécifique</option>
                      {clubsByLeague.map((entry) => (
                        <optgroup
                          key={entry.leagueName}
                          label={`${entry.leagueName} (${entry.clubs.length})`}
                        >
                          {entry.clubs.map((club) => (
                            <option key={club.id} value={club.id}>
                              {club.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-black text-slate-900">Visibilité</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={groupKind === 'public' ? 'primary' : 'soft'}
                    className="min-h-11 flex-1 rounded-2xl px-4 sm:h-9 sm:min-h-0 sm:flex-initial"
                    onClick={() => {
                      setGroupKind('public')
                      setTagError(null)
                    }}
                    aria-pressed={groupKind === 'public'}
                  >
                    Tribune publique
                  </Button>
                  <Button
                    type="button"
                    variant={groupKind === 'private' ? 'primary' : 'soft'}
                    className="min-h-11 flex-1 rounded-2xl px-4 sm:h-9 sm:min-h-0 sm:flex-initial"
                    onClick={() => {
                      setGroupKind('private')
                      setTagError(null)
                    }}
                    aria-pressed={groupKind === 'private'}
                  >
                    Tribune privée
                  </Button>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-600">
                  {groupKind === 'public'
                    ? 'Une tribune publique doit avoir au moins un hashtag : les personnes qui partagent les mêmes centres d’intérêt te retrouvent dans « Toutes les tribunes ».'
                    : 'Les hashtags restent optionnels sur une tribune privée.'}
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
              <div className="text-sm font-black text-slate-900">Ambiance (démo)</div>
              <label className="mt-2 flex flex-col gap-2 text-xs font-bold text-slate-700/70 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <span className="shrink-0">Intensité de la tribune</span>
                <input
                  type="range"
                  min={15}
                  max={98}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="h-2 w-full min-w-0 sm:min-w-[140px] sm:flex-1"
                />
                <span className="shrink-0 tabular-nums text-slate-900">{intensity}%</span>
              </label>
            </div>

            <div className="mt-4">
              <div className="text-sm font-black text-slate-900">Palettes</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {GROUP_THEME_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setPrimary(p.primary)
                      setSecondary(p.secondary)
                      if (p.accent) setAccent(p.accent)
                      else setAccent('')
                    }}
                    className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-800 shadow-sm transition hover:border-violet-300 sm:min-h-0 sm:py-1.5"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 min-w-0">
              <div className="text-sm font-black text-slate-900">Thème</div>
              <div className="mt-2 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
                  <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-2.5 py-2 sm:px-3">
                    <span className="whitespace-nowrap text-xs font-bold text-slate-700/70">
                      Primaire
                    </span>
                    <input
                      type="color"
                      value={primary}
                      onChange={(e) => setPrimary(e.target.value)}
                      className="h-8 w-11 min-w-0 cursor-pointer rounded-lg border border-slate-200 bg-white sm:h-7 sm:w-10"
                      aria-label="Couleur primaire"
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-2.5 py-2 sm:px-3">
                    <span className="whitespace-nowrap text-xs font-bold text-slate-700/70">
                      Secondaire
                    </span>
                    <input
                      type="color"
                      value={secondary}
                      onChange={(e) => setSecondary(e.target.value)}
                      className="h-8 w-11 min-w-0 cursor-pointer rounded-lg border border-slate-200 bg-white sm:h-7 sm:w-10"
                      aria-label="Couleur secondaire"
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-2.5 py-2 sm:px-3">
                    <span className="whitespace-nowrap text-xs font-bold text-slate-700/70">Accent</span>
                    <input
                      type="color"
                      value={accent.trim() ? accent : secondary}
                      onChange={(e) => setAccent(e.target.value)}
                      className="h-8 w-11 min-w-0 cursor-pointer rounded-lg border border-slate-200 bg-white sm:h-7 sm:w-10"
                      aria-label="Couleur d’accent (optionnelle)"
                    />
                  </div>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-slate-200/60 pt-2 sm:border-t-0 sm:pt-0">
                  <Badge className="shrink-0 border-slate-200 bg-white/80 text-slate-900">Fond</Badge>
                  <Button
                    variant={background === 'clean' ? 'primary' : 'soft'}
                    className="h-9 min-h-11 flex-1 rounded-2xl px-3 sm:min-h-0 sm:flex-initial"
                    onClick={() => setBackground('clean')}
                    aria-pressed={background === 'clean'}
                  >
                    Clean
                  </Button>
                  <Button
                    variant={background === 'smoke' ? 'primary' : 'soft'}
                    className="h-9 min-h-11 flex-1 rounded-2xl px-3 sm:min-h-0 sm:flex-initial"
                    onClick={() => setBackground('smoke')}
                    aria-pressed={background === 'smoke'}
                  >
                    Smoke
                  </Button>
                  <Button
                    variant={background === 'stripe' ? 'primary' : 'soft'}
                    className="h-9 min-h-11 flex-1 rounded-2xl px-3 sm:min-h-0 sm:flex-initial"
                    onClick={() => setBackground('stripe')}
                    aria-pressed={background === 'stripe'}
                  >
                    Stripe
                  </Button>
                </div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <Input
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="#000000"
                  aria-label="Primaire hex"
                />
                <Input
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="#000000"
                  aria-label="Secondaire hex"
                />
                <Input
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="Accent (optionnel)"
                  aria-label="Accent hex"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
              <Button
                variant="primary"
                className="min-h-11 w-full rounded-3xl sm:min-h-0 sm:w-auto sm:order-2"
                onClick={() => {
                  setNameError(null)
                  setTagError(null)
                  const trimmedName = name.trim()
                  if (trimmedName.length < 2) {
                    setNameError('Donne un nom d’au moins 2 caractères à ta tribune.')
                    return
                  }
                  if (trimmedName.length > 80) {
                    setNameError('Raccourcis le nom (80 caractères max).')
                    return
                  }
                  if (containsBannedWord(trimmedName)) {
                    setNameError('Ce nom contient des propos inappropriés. Choisis un autre nom.')
                    return
                  }
                  const finalTags = normalizeHashtagList([
                    ...hashtags,
                    ...parseHashtagInput(tagDraft),
                  ])
                  if (groupKind === 'public' && finalTags.length === 0) {
                    setTagError(
                      'Ajoute au moins un hashtag pour que les autres trouvent ta tribune publique.',
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
                  const theme: GroupTheme = { primary, secondary, background }
                  if (accent.trim()) theme.accent = accent.trim()
                  const cleanCountry = affiliationCountry.trim()
                  onCreate({
                    name: trimmedName,
                    emoji: (emoji.trim() || '🧢').slice(0, 8),
                    location: location.trim() || undefined,
                    motto: (motto.trim() || 'On vit le foot ensemble.').slice(0, 200),
                    theme,
                    members: Math.max(1, draft.members),
                    intensity,
                    channels: draft.channels,
                    groupKind,
                    hashtags: finalTags.length > 0 ? finalTags : undefined,
                    fanTags:
                      selectedClub || cleanCountry
                        ? {
                            leagueIds: selectedClub ? [selectedClub.leagueId] : [],
                            clubIds: selectedClub ? [selectedClub.id] : [],
                            countryLabels: cleanCountry ? [cleanCountry] : undefined,
                          }
                        : undefined,
                  })
                  onClose()
                }}
              >
                Créer le groupe
              </Button>
              <Button
                variant="soft"
                className="min-h-11 w-full rounded-3xl sm:min-h-0 sm:w-auto sm:order-1"
                onClick={onClose}
              >
                Annuler
              </Button>
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/70 p-3 sm:rounded-3xl sm:p-4">
            <div className="text-sm font-black text-slate-900">Aperçu</div>
            <div className="mt-3 min-w-0 max-w-full overflow-x-auto">
              <div className="min-w-0 max-w-full">
                <GroupCard group={draft} className="max-w-full" />
              </div>
            </div>
            <div className="mt-3 text-xs font-semibold leading-snug text-slate-700/70 sm:text-sm">
              Après validation, tu es redirigé vers ta tribune. Le groupe est sauvegardé dans ton navigateur (onglet
              Groupes → Mes groupes).
            </div>
          </div>
        </div>
        </Card>
      </div>
    </div>
  )
}

