import type { SupporterGroup } from '../../types/group'
import { CLUB_OFFICIAL_LOGO_BY_ID } from '../../data/clubOfficialLogoUrls'
import { resolveTeamLogoUrl } from '../../utils/catalogLogos'
import { nationFlagUrl } from '../../utils/nationFlagUrl'
import { cn } from '../../utils/cn'

const BACKDROP_MASK =
  'linear-gradient(to left, rgba(0,0,0,0.95) 22%, rgba(0,0,0,0.5) 58%, rgba(0,0,0,0) 100%)'

function IdentityImageBackdrop({
  imageUrl,
  light,
  widthClass = 'w-[46%]',
  variant = 'logo',
}: {
  imageUrl: string
  light: boolean
  widthClass?: string
  variant?: 'logo' | 'flag'
}) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-y-0 right-0 z-[1] overflow-hidden', widthClass)}
      aria-hidden="true"
    >
      <div
        className={cn(
          'absolute inset-y-0 right-[-8%] w-[92%]',
          variant === 'flag'
            ? light
              ? 'opacity-[0.16]'
              : 'opacity-[0.14]'
            : light
              ? 'opacity-[0.13]'
              : 'opacity-[0.11]',
        )}
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: variant === 'flag' ? 'auto 68%' : 'contain',
          filter:
            variant === 'flag'
              ? light
                ? 'saturate(92%)'
                : 'saturate(88%) brightness(1.05)'
              : light
                ? 'grayscale(6%) saturate(85%)'
                : 'grayscale(10%) saturate(70%)',
          WebkitMaskImage: BACKDROP_MASK,
          maskImage: BACKDROP_MASK,
        }}
      />
    </div>
  )
}

export function resolveGroupIdentityBackdropUrl(
  group: SupporterGroup,
  apiLogoUrl?: string | null,
): { url: string; variant: 'logo' | 'flag' } | null {
  const mainClubId = group.fanTags?.clubIds?.[0]
  if (mainClubId) {
    const logoUrl =
      resolveTeamLogoUrl(mainClubId, { apiLogoUrl }) ?? CLUB_OFFICIAL_LOGO_BY_ID[mainClubId]
    if (logoUrl) return { url: logoUrl, variant: 'logo' }
  }

  const nationIso = group.fanTags?.nationIso
  if (nationIso) {
    const flagUrl = nationFlagUrl(nationIso)
    if (flagUrl) return { url: flagUrl, variant: 'flag' }
  }

  return null
}

export function GroupIdentityBackdrop({
  group,
  light,
  apiLogoUrl,
  widthClass,
}: {
  group: SupporterGroup
  light: boolean
  apiLogoUrl?: string | null
  widthClass?: string
}) {
  const identity = resolveGroupIdentityBackdropUrl(group, apiLogoUrl)
  if (!identity) return null
  return (
    <IdentityImageBackdrop
      imageUrl={identity.url}
      light={light}
      widthClass={widthClass}
      variant={identity.variant}
    />
  )
}
