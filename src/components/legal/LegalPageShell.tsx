import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useAppearance } from '../../contexts/AppearanceContext'
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED_LABEL, legalContactMailto } from '../../constants/siteLegal'
import { LogoEncart } from '../../layout/LogoMark'
import { ThemeAppearanceToggle } from '../ui/ThemeAppearanceToggle'
import { cn } from '../../utils/cn'

export function LegalPageShell({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children: ReactNode
}) {
  const { user } = useAuth()
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return (
    <div className="relative min-h-dvh">
      <div className="tf-page-backdrop" aria-hidden />
      <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">
        <ThemeAppearanceToggle variant="floating" className="shadow-sm" />
      </div>
      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold">
          <Link to="/" className="text-tf-cta hover:underline">
            ← Accueil
          </Link>
          <Link to="/about" className="text-tf-cta hover:underline">
            À propos
          </Link>
          <Link to="/privacy" className="text-tf-cta hover:underline">
            Confidentialité
          </Link>
          <Link to="/terms" className="text-tf-cta hover:underline">
            CGU
          </Link>
          {!user ? (
            <Link to="/login" className="text-tf-cta hover:underline">
              Connexion
            </Link>
          ) : null}
        </div>
        <div className="mb-6 flex justify-center">
          <LogoEncart size="lg" isLight={L} />
        </div>
        <article
          className={cn(
            'rounded-3xl border p-6 shadow-sm sm:p-8',
            L ? 'border-tf-dark/10 bg-white/95 text-tf-dark' : 'border-white/15 bg-tf-dark/90 text-slate-100',
          )}
        >
          <h1 className="font-display text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm font-medium opacity-80">{intro}</p>
          {children}
          <section className="mt-10 space-y-2 border-t border-current/10 pt-6">
            <h2 className="font-display text-base font-black">Contact</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Pour toute question (données personnelles, signalement, partenariat, AdSense) :{' '}
              <a
                href={legalContactMailto('Contact Talk Foot')}
                className="font-bold text-tf-cta underline-offset-2 hover:underline"
              >
                {LEGAL_CONTACT_EMAIL}
              </a>
            </p>
            <p className="text-xs font-medium opacity-70">
              Dernière mise à jour : {LEGAL_LAST_UPDATED_LABEL}. Ce texte est informatif ; un avis juridique reste
              recommandé pour un usage commercial à grande échelle.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
