import { useEffect, useMemo, useState } from 'react'
import { useRive } from '@rive-app/react-canvas'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { ALL_CLUBS_BY_ID, findTeamInAnyLeague } from '../../data/allClubsCatalog'
import { useProfile } from '../../hooks/useProfile'
import { ClubCrest } from '../brand/ClubCrest'
import { sportMonksTeamLogoUrlForClubId } from '../../data/sportMonksLogoUrls'

const RIVE_PRESETS = {
  supporter: {
    id: 'supporter',
    label: 'Supporter humain',
    src: '/rive/supporter-expressive.riv',
    artboard: 'New Artboard',
    stateMachine: 'State Machine 1',
  },
  creator: {
    id: 'creator',
    label: 'Avatar Creator',
    src: '/rive/avatar-creator.riv',
    artboard: 'Avatar',
    stateMachine: 'State Machine 1',
  },
  game: {
    id: 'game',
    label: 'Game Character',
    src: '/rive/game-character.riv',
    artboard: 'Character',
    animation: 'Idle',
  },
} as const

type RivePresetId = keyof typeof RIVE_PRESETS

type RuntimeInput = {
  name: string
  type: number
  value?: boolean | number
  fire?: () => void
}

function hash01(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return Math.abs(h >>> 0) / 4294967295
}

function hexToLuma(hex: string): number {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 0.5
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  if (![r, g, b].every(Number.isFinite)) return 0.5
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * Démo Rive "Character Lab".
 * - Si le state machine expose des inputs `energy`, `isCelebrating`, `isFocused`, ils sont pilotés en live.
 * - Sinon, l'animation de base joue quand même (showcase visuel).
 */
export function RiveCharacterLab() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { profile } = useProfile()
  const { favoriteClubIds } = useFanPreferences()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedClubId, setSelectedClubId] = useState<string | null>(favoriteClubIds[0] ?? null)
  const [presetId, setPresetId] = useState<RivePresetId>('supporter')
  const preset = RIVE_PRESETS[presetId]

  const { rive, RiveComponent } = useRive({
    src: preset.src,
    artboard: preset.artboard,
    stateMachines: 'stateMachine' in preset ? preset.stateMachine : undefined,
    animations: 'animation' in preset ? preset.animation : undefined,
    autoplay: true,
    onLoad: () => setLoadError(null),
    onLoadError: (err) => setLoadError(err instanceof Error ? err.message : 'Chargement Rive impossible'),
  })
  useEffect(() => {
    setLoadError(null)
  }, [presetId])

  const inputs = useMemo(() => {
    if (!('stateMachine' in preset)) return []
    const list = rive?.stateMachineInputs(preset.stateMachine) ?? []
    return list as RuntimeInput[]
  }, [rive, preset])
  const [inputVersion, setInputVersion] = useState(0)
  const bumpInputs = () => setInputVersion((v) => v + 1)
  void inputVersion

  const selectedClubMeta = selectedClubId ? ALL_CLUBS_BY_ID[selectedClubId] ?? null : null
  const selectedClubTeam = selectedClubId ? findTeamInAnyLeague(selectedClubId) : null

  const applyHumanPreset = (preset: 'balanced' | 'ultra' | 'calm') => {
    const look = profile.characterLook
    for (const input of inputs) {
      const n = input.name.toLowerCase()
      if (input.type === 58) {
        let v = 50
        if (/skin|teint|tone/.test(n)) {
          v = Math.round((hexToLuma(look.skinTone) * 100))
        } else if (/hair|cheveu/.test(n)) {
          v = Math.round((hexToLuma(look.hairColor) * 100))
        } else if (/eye|oeil/.test(n)) {
          v = Math.round((hexToLuma(look.eyeColor) * 100))
        } else if (/energy|vibe|intensity|mood/.test(n)) {
          v = preset === 'ultra' ? 86 : preset === 'calm' ? 30 : 58
        } else {
          v = Math.round(hash01(`${preset}:${n}`) * 100)
        }
        input.value = Math.max(0, Math.min(100, v))
      } else if (input.type === 56) {
        if (/beard|barbe/.test(n)) input.value = look.beard !== 'none'
        else if (/glass|lunette/.test(n)) input.value = look.glasses !== 'none'
        else if (/cap|hat|bonnet/.test(n)) input.value = look.headwear !== 'none'
        else if (/happy|smile|hyped|celebrat/.test(n)) input.value = preset !== 'calm'
        else input.value = hash01(`${preset}:${n}`) > 0.5
      } else if (input.type === 59 && /random|refresh|shuffle/i.test(n)) {
        input.fire?.()
      }
    }
    bumpInputs()
  }

  const applyClubTheme = () => {
    if (!selectedClubId || !selectedClubTeam) return
    const primary = selectedClubTeam.colors.primary
    const secondary = selectedClubTeam.colors.secondary
    const clubSeed = `${selectedClubId}:${primary}:${secondary}`
    for (const input of inputs) {
      const n = input.name.toLowerCase()
      if (input.type === 58) {
        let v = Math.round(hash01(`${clubSeed}:${n}`) * 100)
        if (/shirt|jersey|kit|club|team|home|away|color|colour/.test(n)) {
          v = Math.round(hexToLuma(primary) * 100)
        } else if (/secondary|accent|trim/.test(n)) {
          v = Math.round(hexToLuma(secondary) * 100)
        } else if (/energy|hype|intensity|mood/.test(n)) {
          v = 72
        }
        input.value = Math.max(0, Math.min(100, v))
      } else if (input.type === 56) {
        if (/jersey|kit|club|team/.test(n)) input.value = true
        else if (/hype|celebrat|chant/.test(n)) input.value = true
        else input.value = hash01(`${clubSeed}:${n}`) > 0.5
      } else if (input.type === 59 && /shuffle|random|refresh|next|switch/.test(n)) {
        input.fire?.()
      }
    }
    bumpInputs()
  }

  return (
    <Card className="p-5 sm:p-6" elevation="soft">
      <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">RIVE CHARACTER LAB</div>
      <h3 className="mt-1 font-display text-xl font-black tracking-tight text-tf-app-fg">
        Avatar supporter interactif (humain)
      </h3>
      <p className="mt-1 text-sm font-semibold text-tf-app-muted">
        Presets de style + personnalisation liée au club. Tu peux appliquer un look supporter en un clic, puis affiner
        via les contrôles avancés du state machine.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(RIVE_PRESETS) as RivePresetId[]).map((id) => (
          <Button
            key={id}
            variant={presetId === id ? 'primary' : 'soft'}
            className="h-8 rounded-xl px-3 text-[11px]"
            onClick={() => setPresetId(id)}
          >
            {RIVE_PRESETS[id].label}
          </Button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <div
          className={cn(
            'relative overflow-hidden rounded-3xl border border-[color:var(--tf-c30-border)]',
            L ? 'bg-gradient-to-b from-sky-50/80 to-white' : 'bg-gradient-to-b from-slate-900 to-[#0a0d16]',
          )}
        >
          <div className="aspect-[16/10] w-full">
            <RiveComponent className="h-full w-full" />
          </div>
          {loadError ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
              <div className="rounded-xl border border-rose-400/50 bg-rose-950/70 px-3 py-2 text-center text-xs font-bold text-rose-100">
                Rive non charge: {loadError}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-[color:var(--tf-c30-border)] p-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-tf-app-muted">Presets humain</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Button variant="soft" className="h-8 rounded-xl px-2 text-[11px]" onClick={() => applyHumanPreset('balanced')}>
                Equilibre
              </Button>
              <Button variant="success" className="h-8 rounded-xl px-2 text-[11px]" onClick={() => applyHumanPreset('ultra')}>
                Matchday
              </Button>
              <Button variant="ghost" className="h-8 rounded-xl px-2 text-[11px]" onClick={() => applyHumanPreset('calm')}>
                Chill
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--tf-c30-border)] p-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-tf-app-muted">Club personalization</p>
            {favoriteClubIds.length ? (
              <>
                <div className="mt-2 flex flex-wrap gap-2">
                  {favoriteClubIds.map((clubId) => {
                    const meta = ALL_CLUBS_BY_ID[clubId]
                    const team = findTeamInAnyLeague(clubId)
                    if (!meta || !team) return null
                    const active = selectedClubId === clubId
                    return (
                      <button
                        key={clubId}
                        type="button"
                        onClick={() => setSelectedClubId(clubId)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-black transition',
                          active
                            ? 'border-emerald-400/70 bg-emerald-50/80 text-emerald-900'
                            : 'border-[color:var(--tf-c30-border)] bg-[color:rgb(var(--tf-app-fg-rgb)/0.04)] text-tf-app-fg',
                        )}
                      >
                        <ClubCrest
                          id={team.id}
                          shortName={team.shortName}
                          colors={team.colors}
                          logoUrl={sportMonksTeamLogoUrlForClubId(clubId) ?? undefined}
                          size={18}
                          clickable={false}
                          className="rounded-full"
                        />
                        {meta.shortName}
                      </button>
                    )
                  })}
                </div>
                <Button
                  variant="primary"
                  className="mt-2 h-8 w-full rounded-xl px-3 text-[11px]"
                  onClick={applyClubTheme}
                  disabled={!selectedClubMeta}
                >
                  Appliquer le style {selectedClubMeta?.shortName ?? 'club'}
                </Button>
              </>
            ) : (
              <p className="mt-2 text-xs font-semibold text-tf-app-muted">
                Ajoute un club favori dans ton profil pour activer le preset supporter lié au club.
              </p>
            )}
          </div>

          {inputs.length ? (
            <div className="space-y-2">
              {inputs.map((input) => {
                // Runtime Rive: 56=boolean, 58=number, 59=trigger.
                if (input.type === 56) {
                  const checked = Boolean(input.value)
                  return (
                    <div key={input.name} className="rounded-2xl border border-[color:var(--tf-c30-border)] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-black text-tf-app-fg">{input.name}</div>
                        <Button
                          variant={checked ? 'primary' : 'soft'}
                          className="h-8 rounded-xl px-3 text-[11px]"
                          onClick={() => {
                            input.value = !checked
                            bumpInputs()
                          }}
                        >
                          {checked ? 'ON' : 'OFF'}
                        </Button>
                      </div>
                    </div>
                  )
                }

                if (input.type === 58) {
                  const value = Number(input.value ?? 0)
                  return (
                    <div key={input.name} className="rounded-2xl border border-[color:var(--tf-c30-border)] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs font-black text-tf-app-fg">{input.name}</label>
                        <span className="text-xs font-bold text-tf-app-muted">{value.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.max(0, Math.min(100, value))}
                        onChange={(e) => {
                          input.value = Number(e.target.value)
                          bumpInputs()
                        }}
                        className="mt-2 w-full accent-emerald-500"
                      />
                    </div>
                  )
                }

                if (input.type === 59) {
                  return (
                    <div key={input.name} className="rounded-2xl border border-[color:var(--tf-c30-border)] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-black text-tf-app-fg">{input.name}</div>
                        <Button
                          variant="success"
                          className="h-8 rounded-xl px-3 text-[11px]"
                          onClick={() => input.fire?.()}
                        >
                          Trigger
                        </Button>
                      </div>
                    </div>
                  )
                }

                return null
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-[color:var(--tf-c30-border)] p-3 text-xs font-semibold text-tf-app-muted">
              Ce preset n'expose pas d'inputs éditables (animation directe).
            </div>
          )}

          <div className="rounded-2xl border border-[color:var(--tf-c30-border)] p-3 text-xs font-semibold text-tf-app-muted">
            Preset: {preset.label} · Artboard: {preset.artboard} · Inputs: {inputs.length}
          </div>
        </div>
      </div>
    </Card>
  )
}

