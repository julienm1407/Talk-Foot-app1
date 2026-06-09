import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { useMonEspaceDrawerOptional } from '../../contexts/MonEspaceDrawerContext'
import { currentUser } from '../../data/users'
import {
  MODULAR_PP_NAV_FRAMING,
  ProfileCharacterThumb,
} from '../profile/ProfileCharacterThumb'
import { tfGhostOnCard } from '../../theme/appearanceClasses'

/** Entrée Mon espace visible — évite de cacher tout derrière le logo seul. */
export function HomeMobileMonEspaceStrip({ className }: { className?: string }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { user: authUser } = useAuth()
  const { profile } = useProfile()
  const monEspace = useMonEspaceDrawerOptional()
  const displayLabel = authUser?.displayName ?? currentUser.username

  return (
    <div
      className={cn(
        'sticky top-0 z-20 mb-1 flex items-center gap-3 rounded-2xl border px-3 py-2.5 backdrop-blur-md',
        L
          ? 'border-tf-dark/12 bg-white/95 shadow-sm'
          : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] shadow-[0_8px_24px_rgba(0,0,0,0.42)]',
        className,
      )}
    >
      <Link
        to="/profile"
        className={cn(TF_FOCUS_VISIBLE, 'shrink-0 rounded-full outline-none')}
        aria-label="Mon profil"
      >
        <ProfileCharacterThumb
          profile={profile}
          size="md"
          imagePriority
          {...MODULAR_PP_NAV_FRAMING}
          className="!size-12 !min-h-12 !min-w-12"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-tf-app-fg">{displayLabel}</p>
        <p className="text-[11px] font-semibold text-tf-app-muted">
          Niv. {profile.level} · Paris, favoris, bonus
        </p>
      </div>
      <button
        type="button"
        onClick={() => monEspace?.openMonEspaceDrawer()}
        className={cn(
          TF_FOCUS_VISIBLE,
          'tf-interactive-press shrink-0 px-3 py-2 text-[11px] font-black',
          L ? 'rounded-xl bg-tf-dark text-white active:bg-tf-dark-alt' : tfGhostOnCard(false),
        )}
      >
        Mon espace
      </button>
    </div>
  )
}
