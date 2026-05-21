import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clubPathForId, resolveClubIdFromSlug } from '../../utils/clubRoute'
import { cn } from '../../utils/cn'
import { resolveTeamLogoUrl } from '../../utils/catalogLogos'
import { sportMonksTeamLogoUrl, sportMonksTeamLogoUrlForClubId } from '../../data/sportMonksLogoUrls'
import { SafeLogoImg } from '../fan/SafeLogoImg'

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function ClubCrest({
  id,
  shortName,
  colors,
  logoUrl,
  sportMonksTeamId,
  size = 40,
  className,
  clickable = true,
}: {
  id: string
  shortName: string
  colors: { primary: string; secondary: string }
  /** URL logo officiel (prioritaire sur le blason stylisé local). */
  logoUrl?: string
  /** Id équipe SportMonks pour fallback logo CDN si besoin. */
  sportMonksTeamId?: number
  size?: number
  className?: string
  /** Clic blason => page club (par défaut). */
  clickable?: boolean
}) {
  const navigate = useNavigate()
  const h = hash(id + shortName)
  const variant = h % 3
  const ring = `rgba(148,163,184,0.75)`

  const bg =
    variant === 0
      ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
      : variant === 1
        ? `linear-gradient(135deg, ${colors.primary}, ${colors.primary}), radial-gradient(18px 18px at 70% 30%, ${colors.secondary}aa, transparent 60%)`
        : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}), repeating-linear-gradient(135deg, rgba(255,255,255,0.22) 0 8px, rgba(255,255,255,0) 8px 16px)`
  const catalogId = resolveClubIdFromSlug(id) ?? id.trim().toLowerCase()
  const primaryLogoUrl = resolveTeamLogoUrl(catalogId, {
    apiLogoUrl: logoUrl,
    sportMonksTeamId,
  })
  const cdnFallbackUrl = useMemo(() => {
    if (sportMonksTeamId != null) return sportMonksTeamLogoUrl(sportMonksTeamId)
    return sportMonksTeamLogoUrlForClubId(catalogId)
  }, [sportMonksTeamId, catalogId])

  const [logoStage, setLogoStage] = useState<'primary' | 'cdn' | 'failed'>('primary')
  useEffect(() => {
    setLogoStage('primary')
  }, [primaryLogoUrl, cdnFallbackUrl, catalogId])

  const activeLogoUrl =
    logoStage === 'cdn' && cdnFallbackUrl && cdnFallbackUrl !== primaryLogoUrl
      ? cdnFallbackUrl
      : logoStage === 'failed'
        ? null
        : primaryLogoUrl

  const showMonogram = !activeLogoUrl

  const openClub = (ev?: { preventDefault?: () => void; stopPropagation?: () => void }) => {
    if (!clickable) return
    ev?.preventDefault?.()
    ev?.stopPropagation?.()
    navigate(clubPathForId(catalogId))
  }

  return (
    <div
      className={cn(
        'relative grid place-items-center overflow-hidden rounded-3xl shadow-sm',
        clickable && 'cursor-pointer transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-sky-300/60',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: activeLogoUrl ? 'transparent' : bg,
        border: `1px solid ${ring}`,
      }}
      role={clickable ? 'link' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Ouvrir la page du club ${shortName}` : undefined}
      aria-hidden={clickable ? undefined : 'true'}
      onClick={clickable ? (e) => openClub(e) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') openClub(e)
            }
          : undefined
      }
    >
      {showMonogram ? <div className="absolute inset-0 bg-gradient-to-t from-black/18 to-transparent" /> : null}
      {activeLogoUrl ? (
        <SafeLogoImg
          key={activeLogoUrl}
          src={activeLogoUrl}
          alt={`Logo ${shortName}`}
          className="relative mx-auto h-[88%] w-[88%] object-contain object-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
          onError={() => {
            if (
              logoStage === 'primary' &&
              cdnFallbackUrl &&
              cdnFallbackUrl !== primaryLogoUrl
            ) {
              setLogoStage('cdn')
              return
            }
            setLogoStage('failed')
          }}
        />
      ) : (
        <div
          className="relative flex items-center justify-center px-1.5 font-black tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
          style={{ fontSize: Math.round(size * 0.32), lineHeight: 1 }}
        >
          {shortName}
        </div>
      )}
      {activeLogoUrl ? (
        <div
          className="pointer-events-none absolute -right-3 -top-3 size-10 rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), transparent 60%)`,
            opacity: 0.55,
          }}
        />
      ) : null}
    </div>
  )
}

