import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useProfile } from '../../hooks/useProfile'
import { PRESET_SKIN, PRESET_HAIR, PRESET_EYES, mergeCharacterLook } from '../../data/characterPresets'
import type { AvatarCharacterLook } from '../../types/profile'
import { cn } from '../../utils/cn'
import { PortraitAvatar2D } from './PortraitAvatar2D'

const HAIR_STYLES: { id: AvatarCharacterLook['hairStyle']; label: string }[] = [
  { id: 'buzz', label: 'Tres court' },
  { id: 'short', label: 'Court' },
  { id: 'wavy', label: 'Ondule' },
  { id: 'long', label: 'Long' },
  { id: 'curly', label: 'Boucle' },
]

const BEARDS: { id: AvatarCharacterLook['beard']; label: string }[] = [
  { id: 'none', label: 'Sans' },
  { id: 'light', label: 'Courte' },
  { id: 'full', label: 'Complete' },
  { id: 'goatee', label: 'Bouc' },
]

type FreeTab = 'hair' | 'beard' | 'eyes' | 'skin'

const FREE_TABS: Array<{ id: FreeTab; label: string }> = [
  { id: 'hair', label: 'Cheveux' },
  { id: 'beard', label: 'Barbes' },
  { id: 'eyes', label: 'Yeux' },
  { id: 'skin', label: 'Peau' },
]

export function CharacterLookEditor() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<FreeTab>('hair')
  const { profile, updateCharacterLook } = useProfile()
  const look = mergeCharacterLook(profile.characterLook)
  const patch = (p: Partial<AvatarCharacterLook>) => updateCharacterLook(p)

  return (
    <Card
      className="overflow-hidden border border-[#2d4668] bg-gradient-to-br from-[#071325] via-[#071a31] to-[#06101f] p-0 shadow-[0_0_0_1px_rgba(154,197,255,0.08),0_22px_60px_rgba(1,16,35,0.65)]"
      elevation="soft"
      id="encart-avatar-2d"
    >
      <div className="p-4 sm:p-5">
        <div className="mb-4 rounded-2xl border border-[#2f4f77] bg-[#071a31]/80 px-4 py-3">
          <p className="text-center text-sm font-black tracking-wide text-[#d7e9ff] sm:text-base">
            SYSTEME SIMPLE ET ROBUSTE
          </p>
          <div className="mt-3 grid gap-2 text-xs font-semibold text-[#b9cfea] sm:grid-cols-2">
            <p>• Layers alignes: base → yeux → barbe → cheveux → maillot → accessoire</p>
            <p>• Aucun reset entre les choix</p>
            <p>• Sauvegarde automatique locale</p>
            <p>• Fallbacks si item manquant</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0">
            <div className="rounded-[24px] border border-[#365f8d] bg-[#061424] p-2 shadow-[0_0_0_1px_rgba(154,197,255,0.08)]">
              <PortraitAvatar2D profile={profile} />
            </div>
          </div>
          <div className="flex min-w-0 w-full flex-1 flex-col gap-3 sm:w-auto sm:pr-1">
            <div>
              <p className="text-[11px] font-black tracking-[0.2em] text-[#95b7dc]">APERCU GLOBAL</p>
              <h3
                id="character-look-title"
                className="font-display text-lg font-black tracking-tight text-[#e9f4ff]"
              >
                Identite gratuite + style premium
              </h3>
              <p className="mt-0.5 text-xs font-medium text-[#9ebfe0]">
                {open
                  ? 'Personnalisation (gratuit): cheveux, barbe, yeux, peau.'
                  : 'Ouvre le panneau de personnalisation gratuite.'}
              </p>
              {profile.profilePhotoDataUrl ? (
                <p className="mt-1 text-[11px] font-semibold text-[#9fd56a]">
                  Mode portrait realiste actif (photo perso).
                </p>
              ) : (
                <p className="mt-1 text-[11px] font-semibold text-[#9ebfe0]">
                  Pour un rendu ultra realiste, ajoute une photo dans la section "Photo de profil".
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                id="character-look-trigger"
                variant="primary"
                className="rounded-2xl bg-[#b7ff2d] text-[#0e1f12] hover:bg-[#c7ff54]"
                aria-expanded={open}
                aria-controls="character-look-panel"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? 'Fermer' : 'Modifier mon avatar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {open ? (
        <div
          id="character-look-panel"
          role="region"
          aria-labelledby="character-look-title"
          className="border-t border-[#2f4f77] px-4 pb-5 pt-3 sm:px-6 sm:pb-6"
        >
          <div className="rounded-2xl border border-[#375f8f] bg-[#061425] p-3">
            <p className="mb-2 text-center text-xl font-black tracking-wide text-[#b7ff2d]">
              PERSONNALISATION (GRATUIT)
            </p>

            <div className="mb-3 flex flex-wrap gap-2">
              {FREE_TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition',
                    tab === item.id
                      ? 'border-[#b7ff2d] bg-[#b7ff2d]/15 text-[#d8ff7e]'
                      : 'border-[#2f4f77] bg-[#081a31] text-[#9ab8d9] hover:border-[#476f9f]',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {tab === 'hair' ? (
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#c9dcf2]">Cheveux</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {HAIR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => patch({ hairStyle: style.id })}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-left text-xs font-bold transition',
                        look.hairStyle === style.id
                          ? 'border-[#b7ff2d] bg-[#b7ff2d]/10 text-[#e6ffb3]'
                          : 'border-[#2f4f77] bg-[#081a31] text-[#aac6e3] hover:border-[#476f9f]',
                      )}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 mb-2 text-xs font-black uppercase tracking-wider text-[#c9dcf2]">
                  Couleur des cheveux
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_HAIR.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => patch({ hairColor: hex })}
                      className={cn(
                        'size-9 rounded-full border-2',
                        look.hairColor === hex ? 'border-[#b7ff2d]' : 'border-[#5f7ea3]',
                      )}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {tab === 'beard' ? (
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#c9dcf2]">Barbes</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BEARDS.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => patch({ beard: style.id })}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-left text-xs font-bold transition',
                        look.beard === style.id
                          ? 'border-[#b7ff2d] bg-[#b7ff2d]/10 text-[#e6ffb3]'
                          : 'border-[#2f4f77] bg-[#081a31] text-[#aac6e3] hover:border-[#476f9f]',
                      )}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {tab === 'eyes' ? (
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#c9dcf2]">
                  Couleur des yeux
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_EYES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => patch({ eyeColor: hex })}
                      className={cn(
                        'size-9 rounded-full border-2',
                        look.eyeColor === hex ? 'border-[#b7ff2d]' : 'border-[#5f7ea3]',
                      )}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => patch({ eyeShape: 'round' })}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-xs font-bold',
                      look.eyeShape === 'round'
                        ? 'border-[#b7ff2d] bg-[#b7ff2d]/10 text-[#e6ffb3]'
                        : 'border-[#2f4f77] bg-[#081a31] text-[#aac6e3]',
                    )}
                  >
                    Ronds
                  </button>
                  <button
                    type="button"
                    onClick={() => patch({ eyeShape: 'almond' })}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-xs font-bold',
                      look.eyeShape === 'almond'
                        ? 'border-[#b7ff2d] bg-[#b7ff2d]/10 text-[#e6ffb3]'
                        : 'border-[#2f4f77] bg-[#081a31] text-[#aac6e3]',
                    )}
                  >
                    Amande
                  </button>
                </div>
              </div>
            ) : null}

            {tab === 'skin' ? (
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#c9dcf2]">
                  Couleur de peau
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SKIN.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => patch({ skinTone: hex })}
                      className={cn(
                        'size-9 rounded-full border-2',
                        look.skinTone === hex ? 'border-[#b7ff2d]' : 'border-[#5f7ea3]',
                      )}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

          </div>
        </div>
      ) : null}
    </Card>
  )
}
