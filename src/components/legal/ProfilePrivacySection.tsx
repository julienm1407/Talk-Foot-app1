import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useAppearance } from '../../contexts/AppearanceContext'
import { downloadPersonalDataExport, purgeAllTalkFootBrowserStorage } from '../../utils/privacyLocal'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

export function ProfilePrivacySection() {
  const { appearance } = useAppearance()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const L = appearance === 'light'

  const handleDelete = () => {
    if (
      !window.confirm(
        'Toutes les données Talk Foot stockées sur cet appareil seront effacées (compte, profil, paris, préférences, etc.). Cette action est irréversible. Continuer ?',
      )
    ) {
      return
    }
    purgeAllTalkFootBrowserStorage()
    logout()
    navigate('/login', { replace: true })
  }

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
        Export ou suppression des données enregistrées localement dans ton navigateur.{' '}
        <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
          Politique de confidentialité
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" variant="soft" className="rounded-xl sm:min-w-0" onClick={() => downloadPersonalDataExport()}>
          Télécharger mes données (JSON)
        </Button>
        <button
          type="button"
          onClick={handleDelete}
          className={cn(
            TF_FOCUS_VISIBLE,
            'inline-flex min-h-tf-touch items-center justify-center rounded-xl border-2 border-rose-600 bg-rose-600 px-5 py-3 text-sm font-black font-display text-white shadow-sm transition hover:bg-rose-500 sm:min-w-0',
          )}
        >
          Supprimer toutes mes données
        </button>
      </div>
    </section>
  )
}
