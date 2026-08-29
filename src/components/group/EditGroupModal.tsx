import { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { containsBannedWord } from '../../utils/bannedWords'
import type {
  GroupPresentationMedia,
  GroupSalonChatBackdrop,
  GroupTheme,
  SupporterGroup,
} from '../../types/group'
import { GROUP_THEME_PRESETS } from '../../data/groupThemePresets'
import {
  DEFAULT_GROUP_QUICK_EMOTES,
  GROUP_SALON_BG_PRESETS,
} from '../../data/groupSalonPresets'

export function EditGroupModal({
  open,
  group,
  onClose,
  onSave,
}: {
  open: boolean
  group: SupporterGroup | null
  onClose: () => void
  onSave: (patch: Partial<Omit<SupporterGroup, 'id' | 'createdAt' | 'createdBy'>>) => void
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🧢')
  const [location, setLocation] = useState('')
  const [motto, setMotto] = useState('')
  const [primary, setPrimary] = useState('#0b1b3a')
  const [secondary, setSecondary] = useState('#0ea5e9')
  const [accent, setAccent] = useState('')
  const [background, setBackground] = useState<'clean' | 'smoke' | 'stripe'>('smoke')
  const [intensity, setIntensity] = useState(70)
  const [salonBackdropMode, setSalonBackdropMode] = useState<'inherit' | 'solid' | 'preset'>('inherit')
  const [salonSolidColor, setSalonSolidColor] = useState('#0f172a')
  const [salonPresetId, setSalonPresetId] = useState('night_stadium')
  const [salonBoxBorder, setSalonBoxBorder] = useState('')
  const [quickEmotesInput, setQuickEmotesInput] = useState('')
  const [scarfLabel, setScarfLabel] = useState('')
  const [scarfA, setScarfA] = useState('#dc2626')
  const [scarfB, setScarfB] = useState('#111827')
  const [scarfC, setScarfC] = useState('#dc2626')
  const [presUrl, setPresUrl] = useState('')
  const [presType, setPresType] = useState<'image' | 'video'>('image')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !group) return
    setName(group.name)
    setEmoji(group.emoji)
    setLocation(group.location ?? '')
    setMotto(group.motto)
    setPrimary(group.theme.primary)
    setSecondary(group.theme.secondary)
    setAccent(group.theme.accent ?? '')
    setBackground(group.theme.background)
    setIntensity(group.intensity)
    setSalonBoxBorder(group.theme.salonBoxBorder ?? '')
    const em = group.theme.quickEmotes?.join(' ') ?? ''
    setQuickEmotesInput(em)
    const bd = group.theme.salonChatBackdrop
    if (!bd || bd.mode === 'inherit') {
      setSalonBackdropMode('inherit')
    } else if (bd.mode === 'solid') {
      setSalonBackdropMode('solid')
      setSalonSolidColor(bd.color)
    } else {
      setSalonBackdropMode('preset')
      setSalonPresetId(bd.presetId in GROUP_SALON_BG_PRESETS ? bd.presetId : 'night_stadium')
    }
    if (group.scarf) {
      setScarfLabel(group.scarf.label)
      setScarfA(group.scarf.colorA)
      setScarfB(group.scarf.colorB)
      setScarfC(group.scarf.colorC)
    } else {
      setScarfLabel('')
      setScarfA('#dc2626')
      setScarfB('#111827')
      setScarfC('#dc2626')
    }
    if (group.presentationMedia) {
      setPresUrl(group.presentationMedia.url)
      setPresType(group.presentationMedia.type)
    } else {
      setPresUrl('')
      setPresType('image')
    }
    setError(null)
  }, [open, group])

  if (!open || !group) return null

  return (
    <div
      className="fixed inset-0 z-[90] overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch]"
      data-no-swipe="true"
      data-tf-modal="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-group-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fermer"
      />

      <div className="relative z-10 mx-auto w-full max-w-[min(100%,28rem)] px-4 py-8 pb-[max(2rem,calc(2rem+env(safe-area-inset-bottom)))] sm:py-10">
        <Card className="relative w-full min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/70">
                TON SALON
              </div>
              <div id="edit-group-title" className="mt-1 text-xl font-black tracking-tight text-slate-900">
                Personnaliser le groupe
              </div>
            </div>
            <Button variant="ghost" className="h-10 rounded-2xl" onClick={onClose}>
              Fermer
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700/70">Nom</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/70">Emoji</label>
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/70">Ville (optionnel)</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700/70">Slogan</label>
              <Input value={motto} onChange={(e) => setMotto(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-black text-slate-900">Ambiance</div>
            <label className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-700/70">
              Intensité
              <input
                type="range"
                min={12}
                max={98}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="min-w-0 flex-1"
              />
              <span className="tabular-nums text-slate-900">{intensity}%</span>
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
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-800 shadow-sm transition hover:border-violet-300"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-black text-slate-900">Couleurs</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-bold text-slate-700/70">
                Primaire
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="h-7 w-10 cursor-pointer rounded-lg border border-slate-200"
                />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-bold text-slate-700/70">
                Secondaire
                <input
                  type="color"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                  className="h-7 w-10 cursor-pointer rounded-lg border border-slate-200"
                />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-bold text-slate-700/70">
                Accent
                <input
                  type="color"
                  value={accent || secondary}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-7 w-10 cursor-pointer rounded-lg border border-slate-200"
                />
              </label>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <Input
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                placeholder="#000000"
                className="font-mono text-xs"
                aria-label="Primaire en hex"
              />
              <Input
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                placeholder="#000000"
                className="font-mono text-xs"
                aria-label="Secondaire en hex"
              />
              <Input
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                placeholder="Accent (optionnel)"
                className="font-mono text-xs"
                aria-label="Accent en hex"
              />
            </div>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Laisse accent vide pour ne garder que le dégradé principal / secondaire.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge className="border-slate-200 bg-white/80 text-slate-900">Fond</Badge>
            {(['clean', 'smoke', 'stripe'] as const).map((b) => (
              <Button
                key={b}
                type="button"
                variant={background === b ? 'primary' : 'soft'}
                className="h-9 rounded-2xl px-3 capitalize"
                onClick={() => setBackground(b)}
              >
                {b}
              </Button>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-200/80 pt-4">
            <div className="text-sm font-black text-slate-900">Fond du chat tribune</div>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Derrière les messages : couleur unie, visuel prédéfini, ou même style que la carte (hériter).
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['inherit', 'solid', 'preset'] as const).map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={salonBackdropMode === m ? 'primary' : 'soft'}
                  className="h-9 rounded-2xl px-3 text-xs capitalize"
                  onClick={() => setSalonBackdropMode(m)}
                >
                  {m === 'inherit' ? 'Hériter' : m === 'solid' ? 'Couleur' : 'Image'}
                </Button>
              ))}
            </div>
            {salonBackdropMode === 'solid' ? (
              <label className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-700/70">
                Couleur
                <input
                  type="color"
                  value={salonSolidColor}
                  onChange={(e) => setSalonSolidColor(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded-lg border border-slate-200"
                />
              </label>
            ) : null}
            {salonBackdropMode === 'preset' ? (
              <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                {Object.entries(GROUP_SALON_BG_PRESETS).map(([id, p]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSalonPresetId(id)}
                    className={`rounded-2xl border px-2.5 py-1.5 text-[10px] font-black shadow-sm ${
                      salonPresetId === id
                        ? 'border-violet-500 bg-violet-50 text-violet-950'
                        : 'border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            <label className="text-xs font-bold text-slate-700/70">
              Contour des boîtes tribune (hex, optionnel)
            </label>
            <Input
              value={salonBoxBorder}
              onChange={(e) => setSalonBoxBorder(e.target.value)}
              placeholder="#94a3b8"
              className="mt-1 font-mono text-xs"
            />
          </div>

          <div className="mt-4">
            <label className="text-xs font-bold text-slate-700/70">
              Emotes rapides (séparés par un espace, max 8)
            </label>
            <Input
              value={quickEmotesInput}
              onChange={(e) => setQuickEmotesInput(e.target.value)}
              placeholder={DEFAULT_GROUP_QUICK_EMOTES.join(' ')}
              className="mt-1 text-sm"
            />
          </div>

          <div className="mt-4 border-t border-slate-200/80 pt-4">
            <div className="text-sm font-black text-slate-900">Écharpe du groupe</div>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Les membres peuvent l’envoyer dans le live et les tribunes.
            </p>
            <Input
              value={scarfLabel}
              onChange={(e) => setScarfLabel(e.target.value)}
              placeholder="Texte sur l’écharpe (ex. ROAZHON)"
              className="mt-2 text-sm"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                A
                <input
                  type="color"
                  value={scarfA}
                  onChange={(e) => setScarfA(e.target.value)}
                  className="h-7 w-9 cursor-pointer rounded border border-slate-200"
                />
              </label>
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                B
                <input
                  type="color"
                  value={scarfB}
                  onChange={(e) => setScarfB(e.target.value)}
                  className="h-7 w-9 cursor-pointer rounded border border-slate-200"
                />
              </label>
              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                C
                <input
                  type="color"
                  value={scarfC}
                  onChange={(e) => setScarfC(e.target.value)}
                  className="h-7 w-9 cursor-pointer rounded border border-slate-200"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200/80 pt-4">
            <div className="text-sm font-black text-slate-900">Média de présentation</div>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Photo ou vidéo supporters — soumis à validation plateforme.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={presType === 'image' ? 'primary' : 'soft'}
                className="h-9 rounded-2xl px-3 text-xs"
                onClick={() => setPresType('image')}
              >
                Image
              </Button>
              <Button
                type="button"
                variant={presType === 'video' ? 'primary' : 'soft'}
                className="h-9 rounded-2xl px-3 text-xs"
                onClick={() => setPresType('video')}
              >
                Vidéo
              </Button>
            </div>
            <Input
              value={presUrl}
              onChange={(e) => setPresUrl(e.target.value)}
              placeholder="https://…"
              className="mt-2 text-xs"
            />
          </div>

          {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="soft" className="rounded-3xl" onClick={onClose}>
              Annuler
            </Button>
            <Button
              variant="primary"
              className="rounded-3xl"
              onClick={() => {
                setError(null)
                const trimmed = name.trim()
                if (trimmed.length < 2) {
                  setError('Nom d’au moins 2 caractères.')
                  return
                }
                if (containsBannedWord(trimmed)) {
                  setError('Ce nom contient des propos inappropriés.')
                  return
                }
                let salonChatBackdrop: GroupSalonChatBackdrop
                if (salonBackdropMode === 'inherit') salonChatBackdrop = { mode: 'inherit' }
                else if (salonBackdropMode === 'solid')
                  salonChatBackdrop = { mode: 'solid', color: salonSolidColor }
                else salonChatBackdrop = { mode: 'preset', presetId: salonPresetId }

                const emTok = quickEmotesInput
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                const quickEmotes =
                  emTok.length > 0 ? Array.from(new Set(emTok)).slice(0, 8) : DEFAULT_GROUP_QUICK_EMOTES

                const theme: GroupTheme = {
                  primary,
                  secondary,
                  background,
                  salonChatBackdrop,
                  quickEmotes,
                }
                if (accent.trim()) theme.accent = accent.trim()
                if (salonBoxBorder.trim()) theme.salonBoxBorder = salonBoxBorder.trim()

                const scarf = scarfLabel.trim()
                  ? {
                      label: scarfLabel.trim().slice(0, 28),
                      colorA: scarfA,
                      colorB: scarfB,
                      colorC: scarfC,
                    }
                  : undefined

                const presentationMedia: GroupPresentationMedia | undefined = presUrl.trim()
                  ? {
                      type: presType,
                      url: presUrl.trim(),
                      moderationStatus: 'pending',
                      caption: 'Soumis — en attente de validation plateforme.',
                    }
                  : undefined

                onSave({
                  name: trimmed,
                  emoji: (emoji.trim() || '🧢').slice(0, 8),
                  location: location.trim() || undefined,
                  motto: (motto.trim() || 'On vit le foot ensemble.').slice(0, 200),
                  theme,
                  intensity,
                  ...(scarf ? { scarf } : { scarf: undefined }),
                  ...(presentationMedia
                    ? { presentationMedia }
                    : { presentationMedia: undefined }),
                })
                onClose()
              }}
            >
              Enregistrer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
