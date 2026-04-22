import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useProfile } from '../../hooks/useProfile'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import {
  PRESET_SKIN,
  PRESET_HAIR,
  PRESET_EYES,
  mergeCharacterLook,
} from '../../data/characterPresets'
import { findTeamInAnyLeague } from '../../data/allClubsCatalog'
import type { AvatarCharacterLook, JerseyPattern } from '../../types/profile'
import { cn } from '../../utils/cn'
import { RotatableAvatarPreview } from './RotatableAvatarPreview'

const HAIR_STYLES: { id: AvatarCharacterLook['hairStyle']; label: string }[] = [
  { id: 'buzz', label: 'Très court' },
  { id: 'short', label: 'Court' },
  { id: 'wavy', label: 'Ondulé' },
  { id: 'long', label: 'Long' },
  { id: 'curly', label: 'Bouclé' },
]

const BEARDS: { id: AvatarCharacterLook['beard']; label: string }[] = [
  { id: 'none', label: 'Sans' },
  { id: 'light', label: 'Courte' },
  { id: 'full', label: 'Complète' },
  { id: 'goatee', label: 'Bouc' },
]

const EYE_SHAPES: { id: AvatarCharacterLook['eyeShape']; label: string }[] = [
  { id: 'round', label: 'Ronds' },
  { id: 'almond', label: 'Amande' },
]

const FACE_EXPRESSIONS: { id: AvatarCharacterLook['faceExpression']; label: string }[] = [
  { id: 'neutral', label: 'Posé' },
  { id: 'happy', label: 'Souriant' },
  { id: 'hyped', label: 'Tribune (max)' },
  { id: 'serious', label: 'Concentré' },
]

const GLASSES: { id: AvatarCharacterLook['glasses']; label: string }[] = [
  { id: 'none', label: 'Sans' },
  { id: 'round', label: 'Rondes' },
  { id: 'sport', label: 'Sport' },
]

const HEADWEAR: { id: AvatarCharacterLook['headwear']; label: string }[] = [
  { id: 'none', label: 'Aucune' },
  { id: 'cap', label: 'Casquette' },
  { id: 'beanie', label: 'Bonnet' },
]

const PATTERNS: { id: JerseyPattern; label: string }[] = [
  { id: 'solid', label: 'Uni' },
  { id: 'hechter', label: 'Bande centrale (style pro)' },
  { id: 'kit_mesh', label: 'Mesh technique' },
  { id: 'vertical', label: 'Rayures ↕' },
  { id: 'horizontal', label: 'Bandes ↔' },
  { id: 'sash', label: 'Diagonale' },
  { id: 'hoops', label: 'Anneaux' },
]

function SwatchRow({
  label,
  colors,
  value,
  onPick,
}: {
  label: string
  colors: string[]
  value: string
  onPick: (hex: string) => void
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-tf-grey">{label}</div>
      <div className="flex flex-wrap gap-2">
        {colors.map((hex) => (
          <button
            key={hex}
            type="button"
            title={hex}
            onClick={() => onPick(hex)}
            className={cn(
              'size-8 rounded-full border-2 shadow-sm transition ring-offset-2',
              value === hex ? 'border-tf-dark ring-2 ring-tf-dark/30' : 'border-white ring-1 ring-black/10',
            )}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
    </div>
  )
}

export function CharacterLookEditor() {
  const [open, setOpen] = useState(false)
  const { profile, updateCharacterLook } = useProfile()
  const { favoriteClubId, preferencesComplete } = useFanPreferences()
  const look = mergeCharacterLook(profile.characterLook)

  const clubShort = favoriteClubId ? findTeamInAnyLeague(favoriteClubId)?.shortName ?? null : null

  /** Dès qu’on touche au maillot de base, on coupe le mode supporter pour que la preview suive (sinon les couleurs club masquent tout). */
  const patch = (p: Partial<AvatarCharacterLook>) => {
    const touchesOutfit =
      p.outfitPrimary !== undefined ||
      p.outfitSecondary !== undefined ||
      p.outfitPattern !== undefined
    if (touchesOutfit && look.supporterTint) {
      updateCharacterLook({ ...p, supporterTint: false })
      return
    }
    updateCharacterLook(p)
  }

  const panelId = 'character-look-panel'

  return (
    <Card className="overflow-hidden p-0" elevation="soft" id="encart-avatar-3d">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0">
            <RotatableAvatarPreview profile={profile} />
          </div>
          <div className="flex min-w-0 w-full flex-1 flex-col gap-3 sm:w-auto sm:pr-1">
            <div>
              <p className="text-[11px] font-black tracking-[0.2em] text-tf-grey">APPARENCE</p>
              <h3
                id="character-look-title"
                className="font-display text-lg font-black tracking-tight text-tf-dark"
              >
                Personnage & tenue de base
              </h3>
              <p className="mt-0.5 text-xs font-medium text-tf-grey">
                {open
                  ? 'Ajuste visage, couleurs et mode supporter — l’aperçu 3D à côté se met à jour en direct.'
                  : 'Un seul aperçu 3D sur la page. Touche « Personnalité » pour afficher les réglages.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                id="character-look-trigger"
                variant="primary"
                className="rounded-2xl"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? 'Fermer les réglages' : 'Personnalité'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby="character-look-title"
          className="border-t border-tf-grey-pastel/50 px-4 pb-5 pt-1 sm:px-6 sm:pb-6"
        >
          <p className="mb-4 text-sm font-medium text-tf-grey">
            Couleurs et formes génériques — aucun logo officiel.
          </p>

          {look.supporterTint && preferencesComplete && favoriteClubId ? (
            <div className="mb-5 rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-xs font-semibold text-amber-950">
              <strong className="font-black">Aperçu maillot :</strong> le mode supporter affiche les couleurs de ton
              club sur le torse. Change une couleur ou un motif de tenue ci-dessous pour{' '}
              <strong>désactiver automatiquement</strong> ce mode et voir tes réglages — ou coupe-le avec le bouton en
              bas.
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <div className="mb-3 text-xs font-black text-tf-dark">Peau & cheveux</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SwatchRow label="Teint" colors={PRESET_SKIN} value={look.skinTone} onPick={(h) => patch({ skinTone: h })} />
                  <SwatchRow label="Cheveux" colors={PRESET_HAIR} value={look.hairColor} onPick={(h) => patch({ hairColor: h })} />
                </div>
                <label className="mt-4 block text-[10px] font-black uppercase text-tf-grey">Coupe</label>
                <select
                  className="mt-1 w-full rounded-xl border border-tf-grey-pastel/60 bg-white px-3 py-2 text-sm font-semibold text-tf-dark"
                  value={look.hairStyle}
                  onChange={(e) => patch({ hairStyle: e.target.value as AvatarCharacterLook['hairStyle'] })}
                >
                  {HAIR_STYLES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-3 text-xs font-black text-tf-dark">Visage</div>
                <SwatchRow label="Yeux" colors={PRESET_EYES} value={look.eyeColor} onPick={(h) => patch({ eyeColor: h })} />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-tf-grey">Forme des yeux</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-tf-grey-pastel/60 bg-white px-3 py-2 text-sm font-semibold"
                      value={look.eyeShape}
                      onChange={(e) => patch({ eyeShape: e.target.value as AvatarCharacterLook['eyeShape'] })}
                    >
                      {EYE_SHAPES.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-tf-grey">Barbe</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-tf-grey-pastel/60 bg-white px-3 py-2 text-sm font-semibold"
                      value={look.beard}
                      onChange={(e) => patch({ beard: e.target.value as AvatarCharacterLook['beard'] })}
                    >
                      {BEARDS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black uppercase text-tf-grey">Expression</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-tf-grey-pastel/60 bg-white px-3 py-2 text-sm font-semibold text-tf-dark"
                      value={look.faceExpression}
                      onChange={(e) =>
                        patch({ faceExpression: e.target.value as AvatarCharacterLook['faceExpression'] })
                      }
                    >
                      {FACE_EXPRESSIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] font-medium text-tf-grey">
                      Bouche & sourcils — yeux plus détaillés (iris, reflets).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-3 text-xs font-black text-tf-dark">Accessoires de tête (base)</div>
                <p className="mb-2 text-xs text-tf-grey">Masqués si tu équipes une casquette depuis la boutique.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-tf-grey">Coiffe</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-tf-grey-pastel/60 bg-white px-3 py-2 text-sm font-semibold"
                      value={look.headwear}
                      onChange={(e) => patch({ headwear: e.target.value as AvatarCharacterLook['headwear'] })}
                    >
                      {HEADWEAR.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-tf-grey">Lunettes</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-tf-grey-pastel/60 bg-white px-3 py-2 text-sm font-semibold"
                      value={look.glasses}
                      onChange={(e) => patch({ glasses: e.target.value as AvatarCharacterLook['glasses'] })}
                    >
                      {GLASSES.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 text-xs font-black text-tf-dark">Tenue (sans maillot boutique)</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-tf-grey">Couleur principale</label>
                    <input
                      type="color"
                      className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-tf-grey-pastel/60"
                      value={look.outfitPrimary}
                      onChange={(e) => patch({ outfitPrimary: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-tf-grey">Couleur secondaire</label>
                    <input
                      type="color"
                      className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-tf-grey-pastel/60"
                      value={look.outfitSecondary}
                      onChange={(e) => patch({ outfitSecondary: e.target.value })}
                    />
                  </div>
                </div>
                <label className="mt-4 block text-[10px] font-black uppercase text-tf-grey">Motif du haut</label>
                <select
                  className="mt-1 w-full rounded-xl border border-tf-grey-pastel/60 bg-white px-3 py-2 text-sm font-semibold"
                  value={look.outfitPattern}
                  onChange={(e) => patch({ outfitPattern: e.target.value as JerseyPattern })}
                >
                  {PATTERNS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-violet-200/80 bg-violet-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-violet-950">Mode supporter</div>
                    <p className="mt-0.5 text-xs font-medium text-violet-900/80">
                      {preferencesComplete && clubShort
                        ? `Couleurs « ${clubShort} » sur le haut + titres d’accueil mis en avant. Les matchs et actus restent larges ; seul le fil équipe de cœur (Profil) filtre les messages.`
                        : 'Choisis un club dans les préférences fan pour activer les couleurs tribune.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={look.supporterTint ? 'primary' : 'soft'}
                    className="shrink-0 rounded-xl text-xs"
                    disabled={!preferencesComplete || !favoriteClubId}
                    onClick={() => patch({ supporterTint: !look.supporterTint })}
                  >
                    {look.supporterTint ? 'Activé' : 'Activer'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
