import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useAppearance } from '../../contexts/AppearanceContext'
import { downloadPersonalDataExport, purgeAllTalkFootBrowserStorage } from '../../utils/privacyLocal'
import { cn } from '../../utils/cn'
import { MODERATION_POLICY_SUMMARY_FR } from '../../utils/bannedWords'
import { LEGAL_CONTACT_EMAIL, legalContactMailto } from '../../constants/siteLegal'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { getSupabaseBrowserClient } from '../../lib/supabase/client'
import { isSupabaseConfigured } from '../../lib/supabase/isEnabled'
import {
  bindTalkfootActorSession,
  deleteMyTalkfootAccount,
} from '../../lib/supabase/bindTalkfootActorSession'
import { ensureTalkFootSupabaseSession, isClerkAuthMode } from '../../lib/supabase/talkfootSession'

function ProfilePrivacyActionsInner({ clerkSessionId }: { clerkSessionId: string | null }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Toutes les données Talk Foot (navigateur et compte cloud si connecté) seront effacées : profil, paris, préférences, tribunes liées, etc. Cette action est irréversible. Continuer ?',
      )
    ) {
      return
    }

    setDeleting(true)
    let cloudError: string | null = null

    if (isSupabaseConfigured() && user?.id) {
      const sb = getSupabaseBrowserClient()
      if (sb) {
        try {
          await ensureTalkFootSupabaseSession(sb)
          if (isClerkAuthMode() && clerkSessionId) {
            await bindTalkfootActorSession(sb, user.id, clerkSessionId)
          }
          const deleteResult = await deleteMyTalkfootAccount(sb, user.id)
          if (!deleteResult.ok) {
            cloudError = deleteResult.error ?? 'cloud_delete_failed'
          }
        } catch (err) {
          cloudError = err instanceof Error ? err.message : 'cloud_delete_failed'
        }
      }
    }

    purgeAllTalkFootBrowserStorage()
    logout()
    navigate('/login', { replace: true })

    if (cloudError) {
      window.alert(
        `Données locales effacées. La suppression cloud a échoué (${cloudError}) — contacte ${LEGAL_CONTACT_EMAIL} pour finaliser.`,
      )
    }

    setDeleting(false)
  }

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button type="button" variant="soft" className="rounded-xl sm:min-w-0" onClick={() => downloadPersonalDataExport()}>
        Télécharger mes données (JSON)
      </Button>
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        className={cn(
          TF_FOCUS_VISIBLE,
          'inline-flex min-h-tf-touch items-center justify-center rounded-xl border-2 border-rose-600 bg-rose-600 px-5 py-3 text-sm font-black font-display text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-60 sm:min-w-0',
        )}
      >
        {deleting ? 'Suppression…' : 'Supprimer toutes mes données'}
      </button>
    </div>
  )
}

function ProfilePrivacyActionsClerk() {
  const { clerkSessionId } = useAuth()
  return <ProfilePrivacyActionsInner clerkSessionId={clerkSessionId} />
}

export function ProfilePrivacySection() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-5',
        L ? 'border-sky-200/70 bg-sky-50/50' : 'border-sky-400/20 bg-sky-950/35',
      )}
    >
      <h2
        className={cn(
          'font-display text-lg font-black',
          L ? 'text-tf-app-fg' : 'text-sky-100',
        )}
      >
        Données personnelles
      </h2>
      <p
        className={cn(
          'mt-1 text-sm font-medium',
          L ? 'text-tf-app-muted' : 'text-sky-200/90',
        )}
      >
        Export ou suppression des données locales et du compte cloud Talk Foot.{' '}
        <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
          Politique de confidentialité
        </Link>
        .
      </p>
      <div
        className={cn(
          'mt-5 rounded-xl border p-3 sm:p-4',
          L ? 'border-violet-200/80 bg-violet-50/40' : 'border-violet-400/25 bg-violet-950/30',
        )}
      >
        <h3 className={cn('text-sm font-black', L ? 'text-tf-app-fg' : 'text-violet-100')}>Modération</h3>
        <p className={cn('mt-1 text-xs font-medium leading-relaxed', L ? 'text-tf-app-muted' : 'text-violet-200/90')}>
          {MODERATION_POLICY_SUMMARY_FR}{' '}
          <Link to="/terms#ugc" className="font-bold text-tf-cta underline-offset-2 hover:underline">
            Charte UGC
          </Link>
          .
        </p>
        <a
          href={legalContactMailto(
            'Signalement abus Talk Foot',
            'Décris le contenu ou l’utilisateur concerné (capture si possible) :\n\n',
          )}
          className={cn(
            'mt-3 inline-flex min-h-tf-touch items-center justify-center rounded-xl border px-4 py-2 text-xs font-black',
            L
              ? 'border-violet-300 bg-white text-violet-950 hover:bg-violet-50'
              : 'border-violet-400/40 bg-violet-900/50 text-violet-50 hover:bg-violet-900/70',
          )}
        >
          Signaler un abus ({LEGAL_CONTACT_EMAIL})
        </a>
      </div>

      {isClerkAuthMode() ? (
        <ProfilePrivacyActionsClerk />
      ) : (
        <ProfilePrivacyActionsInner clerkSessionId={null} />
      )}
    </section>
  )
}
