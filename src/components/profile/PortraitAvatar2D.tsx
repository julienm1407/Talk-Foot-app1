import { useMemo } from 'react'
import type { PortraitBackdropId, UserProfile } from '../../types/profile'
import { mergeCharacterLook } from '../../data/characterPresets'
import { resolveAvatarLoadout } from '../../data/avatar2dCatalog'
import { avatarItems } from '../../data/shop'
import { findTeamInAnyLeague } from '../../data/allClubsCatalog'
import { CharacterAvatarSvg } from './CharacterAvatarSvg'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  if (![r, g, b].every(Number.isFinite)) return null
  return { r, g, b }
}

const FALLBACK_CLUB = { primary: '#0f766e', secondary: '#0ea5e9' }

/** Foule + brumes (existant). */
function BackdropTribune({ light }: { light: boolean }) {
  const crowd = light ? 'text-slate-800' : 'text-slate-950'
  const mistA = light ? 'rgba(16,185,129,0.14)' : 'rgba(52,211,153,0.12)'
  const mistB = light ? 'rgba(59,130,246,0.08)' : 'rgba(56,189,248,0.07)'
  const beam = light ? 'rgba(250,204,21,0.06)' : 'rgba(250,204,21,0.05)'

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 95% 70% at 50% 115%, ${mistA}, transparent 52%),
            radial-gradient(ellipse 55% 45% at 12% 88%, ${mistB}, transparent 50%),
            radial-gradient(ellipse 50% 40% at 88% 85%, ${mistB}, transparent 48%),
            linear-gradient(180deg, ${light ? '#f0f9ff' : '#0b1220'} 0%, ${light ? '#e0f2fe' : '#060a12'} 45%, ${light ? '#cbd5e1' : '#020617'} 100%)`,
        }}
      />
      <div
        className="absolute -left-[8%] top-[18%] h-[55%] w-[35%] blur-2xl opacity-90"
        style={{ background: `radial-gradient(circle, ${beam}, transparent 68%)` }}
      />
      <div
        className="absolute -right-[5%] top-[22%] h-[50%] w-[32%] blur-2xl opacity-80"
        style={{ background: `radial-gradient(circle, ${beam}, transparent 70%)` }}
      />

      <svg
        className={cn('absolute bottom-0 left-[-5%] right-[-5%] h-[52%] opacity-[0.2]', crowd)}
        viewBox="0 0 400 140"
        preserveAspectRatio="none"
      >
        <ellipse cx="55" cy="118" rx="28" ry="62" />
        <ellipse cx="115" cy="122" rx="24" ry="58" />
        <ellipse cx="175" cy="118" rx="30" ry="64" />
        <ellipse cx="235" cy="124" rx="26" ry="60" />
        <ellipse cx="300" cy="119" rx="32" ry="66" />
        <ellipse cx="360" cy="125" rx="27" ry="59" />
        <path
          d="M40 95 Q55 70 70 88 M95 92 Q110 65 128 85 M155 90 Q175 62 198 82 M225 93 Q248 68 272 88 M298 91 Q318 60 338 84 M355 94 Q368 72 382 90"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          opacity={0.35}
        />
      </svg>

      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, white 0.5px, transparent 0.6px),
            radial-gradient(circle at 70% 20%, white 0.45px, transparent 0.55px),
            radial-gradient(circle at 50% 60%, white 0.4px, transparent 0.5px)`,
          backgroundSize: '12px 14px, 18px 16px, 22px 20px',
        }}
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t',
          light ? 'from-slate-300/50 to-transparent' : 'from-black/55 to-transparent',
        )}
      />
    </div>
  )
}

function BackdropClubSunburst({ primary, secondary, light }: { primary: string; secondary: string; light: boolean }) {
  const P = hexToRgb(primary) ?? hexToRgb(FALLBACK_CLUB.primary)!
  const S = hexToRgb(secondary) ?? hexToRgb(FALLBACK_CLUB.secondary)!
  const base = light ? '#f8fafc' : '#020617'
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        background: `conic-gradient(from 200deg at 50% 108%, 
          rgba(${P.r},${P.g},${P.b},0.55) 0deg,
          rgba(${S.r},${S.g},${S.b},0.4) 55deg,
          rgba(${P.r},${P.g},${P.b},0.35) 110deg,
          transparent 160deg,
          ${base} 360deg)`,
      }}
      aria-hidden
    />
  )
}

function BackdropClubStripes({ primary, secondary, light }: { primary: string; secondary: string; light: boolean }) {
  const p = primary
  const s = secondary
  const wash = light ? 'rgba(255,255,255,0.88)' : 'rgba(15,23,42,0.92)'
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        background: `${wash}, repeating-linear-gradient(95deg, ${p} 0px, ${p} 14px, ${s} 14px, ${s} 28px)`,
        backgroundBlendMode: light ? 'overlay' : 'multiply',
        opacity: light ? 1 : 0.95,
      }}
      aria-hidden
    />
  )
}

function BackdropBubbles({ primary, secondary, light }: { primary: string; secondary: string; light: boolean }) {
  const blobs = [
    { l: '8%', t: '62%', w: '42%', h: '38%', c: primary, o: light ? 0.2 : 0.28 },
    { l: '58%', t: '58%', w: '48%', h: '44%', c: secondary, o: light ? 0.18 : 0.26 },
    { l: '28%', t: '18%', w: '36%', h: '32%', c: secondary, o: light ? 0.12 : 0.18 },
    { l: '62%', t: '12%', w: '28%', h: '26%', c: primary, o: light ? 0.1 : 0.16 },
  ]
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
        light ? 'bg-gradient-to-b from-sky-50 to-white' : 'bg-gradient-to-b from-slate-900 to-slate-950',
      )}
      aria-hidden
    >
      {blobs.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            left: b.l,
            top: b.t,
            width: b.w,
            height: b.h,
            background: b.c,
            opacity: b.o,
          }}
        />
      ))}
    </div>
  )
}

function BackdropConfetti({ primary, secondary, light }: { primary: string; secondary: string; light: boolean }) {
  const pieces = [
    { x: 12, y: 22, w: 10, h: 6, r: 12, c: primary },
    { x: 78, y: 18, w: 8, h: 8, r: 45, c: secondary },
    { x: 22, y: 72, w: 12, h: 5, r: -8, c: secondary },
    { x: 65, y: 58, w: 9, h: 9, r: 20, c: primary },
    { x: 45, y: 38, w: 7, h: 11, r: 33, c: light ? primary : secondary },
    { x: 88, y: 78, w: 11, h: 5, r: -22, c: primary },
    { x: 8, y: 48, w: 6, h: 6, r: 0, c: secondary },
  ]
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
        light ? 'bg-gradient-to-br from-amber-50/90 via-white to-sky-50' : 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900',
      )}
      aria-hidden
    >
      <svg className="absolute inset-0 size-full opacity-[0.45]" viewBox="0 0 100 100" preserveAspectRatio="none">
        {pieces.map((p, i) => (
          <rect
            key={i}
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.h}
            rx={1.5}
            fill={p.c}
            opacity={light ? 0.55 : 0.5}
            transform={`rotate(${p.r} ${p.x + p.w / 2} ${p.y + p.h / 2})`}
          />
        ))}
      </svg>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 40%, ${primary}22, transparent 35%),
            radial-gradient(circle at 70% 60%, ${secondary}22, transparent 40%)`,
        }}
      />
    </div>
  )
}

function BackdropCalm({ light }: { light: boolean }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        light
          ? 'bg-gradient-to-b from-slate-100 via-white to-sky-50'
          : 'bg-gradient-to-b from-slate-900 via-slate-950 to-black',
      )}
      aria-hidden
    />
  )
}

function PortraitBackdropLayer({
  id,
  light,
  clubPrimary,
  clubSecondary,
}: {
  id: PortraitBackdropId
  light: boolean
  clubPrimary: string
  clubSecondary: string
}) {
  switch (id) {
    case 'tribune':
      return <BackdropTribune light={light} />
    case 'club_sunburst':
      return <BackdropClubSunburst primary={clubPrimary} secondary={clubSecondary} light={light} />
    case 'club_stripes':
      return <BackdropClubStripes primary={clubPrimary} secondary={clubSecondary} light={light} />
    case 'bubbles':
      return <BackdropBubbles primary={clubPrimary} secondary={clubSecondary} light={light} />
    case 'confetti':
      return <BackdropConfetti primary={clubPrimary} secondary={clubSecondary} light={light} />
    case 'calm':
    default:
      return <BackdropCalm light={light} />
  }
}

export function PortraitAvatar2D({
  profile,
  className,
  favoriteClubIds = [],
}: {
  profile: UserProfile
  className?: string
  /** Pour résoudre les couleurs club des fonds (1er favori si `portraitBackdropClubId` vide). */
  favoriteClubIds?: string[]
}) {
  const { appearance } = useAppearance()
  const light = appearance === 'light'
  const loadout = resolveAvatarLoadout(profile)
  const look = useMemo(() => {
    const merged = mergeCharacterLook(profile.characterLook)
    return {
      ...merged,
      skinTone: loadout.skinColor,
      eyeColor: loadout.eyeColor,
      hairColor: loadout.hairColor,
    }
  }, [profile.characterLook, loadout.skinColor, loadout.eyeColor, loadout.hairColor])
  const kit = avatarItems.find((item) => item.id === loadout.kit)
  const pantsId = profile.equippedItems?.pants ?? 'pants-kit'
  const pants = avatarItems.find((item) => item.id === pantsId)
  const shoesId = profile.equippedItems?.shoes ?? 'shoes-studs'

  const backdropId: PortraitBackdropId = profile.portraitBackdrop ?? 'tribune'
  const clubId = profile.portraitBackdropClubId ?? favoriteClubIds[0] ?? null
  const team = clubId ? findTeamInAnyLeague(clubId) : null
  const clubPrimary = team?.colors.primary ?? FALLBACK_CLUB.primary
  const clubSecondary = team?.colors.secondary ?? FALLBACK_CLUB.secondary

  const shell = cn(
    'relative mx-auto overflow-hidden rounded-[32px] border shadow-2xl',
    light
      ? 'border-slate-200/90 bg-white shadow-slate-300/40'
      : 'border-white/12 bg-slate-950 shadow-black/60',
  )

  return (
    <div className={className}>
      <div
        className={cn(
          shell,
          'h-[min(72vw,320px)] w-[min(88vw,268px)] max-h-[320px] max-w-[268px] sm:h-[320px] sm:w-[268px]',
        )}
      >
        <PortraitBackdropLayer
          id={backdropId}
          light={light}
          clubPrimary={clubPrimary}
          clubSecondary={clubSecondary}
        />

        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-[1] rounded-[inherit] ring-1 ring-inset',
            light ? 'ring-slate-900/8' : 'ring-white/10',
          )}
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-[1] rounded-[inherit] bg-gradient-to-b from-white/10 via-transparent to-black/25',
            light && 'from-white/40 to-slate-900/10',
          )}
        />

        <div className="absolute inset-0 z-[2] flex items-end justify-center overflow-hidden pb-1 pt-14 sm:pb-2 sm:pt-16">
            <div
              className="relative flex h-[118%] w-[122%] max-w-none origin-bottom scale-[1.14] items-end justify-center sm:scale-[1.18]"
              style={{ transformOrigin: '50% 100%' }}
            >
              <CharacterAvatarSvg
                look={look}
                jerseyOverride={kit?.jerseyVisual ?? null}
                supporterColors={null}
                variant="front"
                className="h-full w-full max-h-none max-w-none drop-shadow-[0_16px_28px_rgba(0,0,0,0.5)]"
                pantsItemId={pantsId}
                shoesItemId={shoesId}
              />
              {pants?.pantsVisual?.imageUrl ? (
                <img
                  src={pants.pantsVisual.imageUrl}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-[52%] z-[3] w-[62%] -translate-x-1/2 select-none object-contain object-bottom drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]"
                />
              ) : null}
              {kit?.jerseyVisual?.imageUrl ? (
                <>
                  {/* Maillot PNG officiel : posé sur le buste, evidé sur la zone tête */}
                  <img
                    src={kit.jerseyVisual.imageUrl}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    style={{
                      maskImage:
                        'radial-gradient(ellipse 28% 22% at 50% 6%, transparent 70%, black 92%)',
                      WebkitMaskImage:
                        'radial-gradient(ellipse 28% 22% at 50% 6%, transparent 70%, black 92%)',
                    }}
                    className="pointer-events-none absolute left-1/2 top-[28%] w-[78%] -translate-x-1/2 select-none object-contain object-top drop-shadow-[0_14px_24px_rgba(0,0,0,0.55)]"
                  />
                  {/* Re-rendu tête par-dessus pour rester devant le maillot */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      clipPath: 'inset(0 0 44% 0)',
                      WebkitClipPath: 'inset(0 0 44% 0)',
                    }}
                    aria-hidden
                  >
                    <CharacterAvatarSvg
                      look={look}
                      jerseyOverride={kit?.jerseyVisual ?? null}
                      supporterColors={null}
                      variant="front"
                      className="h-full w-full max-h-none max-w-none"
                      pantsItemId={pantsId}
                      shoesItemId={shoesId}
                    />
                  </div>
                </>
              ) : null}
            </div>
        </div>
      </div>
    </div>
  )
}
