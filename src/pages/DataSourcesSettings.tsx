import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PageContainer } from '../components/ui/PageContainer'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAppearance } from '../contexts/AppearanceContext'
import { cn } from '../utils/cn'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'
import { API_TOKENS_CHANGED_EVENT } from '../constants/apiKeysStorage'
import {
  getSportMonksToken,
  getSportMonksTokenSource,
  hasBrowserSportMonksToken,
  setSportMonksTokenBrowser,
} from '../utils/apiTokens'
import { fetchSportMonksInplay } from '../api/sportMonks'

const SM_KEY_HASH = '#tf-sportmonks-cle'

export function DataSourcesSettingsPage() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const location = useLocation()
  const tokenInputRef = useRef<HTMLInputElement>(null)

  const [smDraft, setSmDraft] = useState('')
  const [showSm, setShowSm] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busySm, setBusySm] = useState(false)
  const [, setStorageTick] = useState(0)

  const envSm = Boolean(import.meta.env.VITE_SPORTMONKS_TOKEN?.trim())
  const tokenSource = getSportMonksTokenSource()

  useEffect(() => {
    const bump = () => setStorageTick((n) => n + 1)
    window.addEventListener(API_TOKENS_CHANGED_EVENT, bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener(API_TOKENS_CHANGED_EVENT, bump)
      window.removeEventListener('storage', bump)
    }
  }, [])

  const browserSm = hasBrowserSportMonksToken()

  useEffect(() => {
    setMsg(null)
    setErr(null)
  }, [smDraft])

  /** Lien Profil / Accueil avec ancre : scroll + focus sur le champ clé. */
  useEffect(() => {
    if (location.hash !== SM_KEY_HASH) return
    const t = window.setTimeout(() => {
      document.getElementById('tf-sportmonks-cle')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      tokenInputRef.current?.focus()
    }, 100)
    return () => window.clearTimeout(t)
  }, [location.hash, location.pathname])

  const saveSportMonks = useCallback(() => {
    setErr(null)
    setMsg(null)
    const t = smDraft.trim()
    setSportMonksTokenBrowser(t.length ? t : null)
    setSmDraft('')
    setMsg(
      t.length
        ? 'Clé SportMonks enregistrée sur ce navigateur. Les matchs vont se recharger.'
        : 'Clé SportMonks effacée du navigateur.',
    )
  }, [smDraft])

  const testSportMonks = useCallback(async () => {
    setErr(null)
    setMsg(null)
    const token = smDraft.trim() || getSportMonksToken()
    if (!token) {
      setErr('Colle une clé ou enregistre-la avant de tester.')
      return
    }
    setBusySm(true)
    try {
      await fetchSportMonksInplay(token)
      setMsg('Connexion SportMonks OK (matchs en cours récupérés ou liste vide).')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur SportMonks')
    } finally {
      setBusySm(false)
    }
  }, [smDraft])

  const label = L ? 'text-tf-app-muted' : 'text-sky-200/80'
  const inputCls = cn(
    'w-full rounded-xl border px-3 py-2.5 font-mono text-sm outline-none transition',
    L
      ? 'border-tf-grey-pastel/70 bg-white text-tf-dark placeholder:text-tf-app-muted/70 focus:border-tf-electric/50 focus:ring-2 focus:ring-tf-electric/20'
      : 'border-white/18 bg-white/[0.06] text-white placeholder:text-sky-200/40 focus:border-sky-400/45 focus:ring-2 focus:ring-sky-400/20',
  )

  return (
    <div className="relative min-h-dvh pb-16 pt-6">
      <div className="tf-page-backdrop" aria-hidden />
      <PageContainer maxWidth="wide" className="relative">
        <header className="mb-8 space-y-3">
          <Link
            to="/profile"
            className={cn(
              'inline-flex text-sm font-bold transition',
              L ? 'text-tf-electric-deep hover:underline' : 'text-sky-200 hover:text-white hover:underline',
              TF_FOCUS_VISIBLE,
            )}
          >
            ← Retour au profil
          </Link>
          <h1 className="font-display text-2xl font-black tracking-tight text-tf-app-fg sm:text-3xl">
            SportMonks — clé API
          </h1>
          <p className={cn('max-w-2xl text-sm leading-relaxed', label)}>
            Les matchs (live + calendrier) viennent uniquement de{' '}
            <strong className="text-tf-app-fg">SportMonks</strong>. Colle ton jeton puis{' '}
            <strong className="text-tf-app-fg">Enregistrer</strong> : tout reste dans{' '}
            <strong className="text-tf-app-fg">ce navigateur</strong> (localStorage) — pratique en dev, mais les autres
            visiteurs de talk-foot.com ne la voient pas.
          </p>
          <p className={cn('max-w-2xl text-sm leading-relaxed', label)}>
            Pour que <strong className="text-tf-app-fg">tout le monde</strong> sur le site ait les vrais matchs : définis{' '}
            <code className="rounded bg-black/10 px-1 py-0.5 text-xs">VITE_SPORTMONKS_TOKEN</code> sur ton hébergeur
            (ex. <strong className="text-tf-app-fg">Vercel</strong> → Projet → Settings → Environment Variables →
            Production), puis <strong className="text-tf-app-fg">Redeploy</strong>. En local, le même nom dans{' '}
            <code className="rounded bg-black/10 px-1 py-0.5 text-xs">.env.local</code> ; cette variable{' '}
            <strong className="text-tf-app-fg">prime</strong> sur le champ ci-dessous.
          </p>
          <p className={cn('max-w-2xl text-sm leading-relaxed', label)}>
            Les requêtes HTTP partent <strong className="text-tf-app-fg">directement de ton navigateur</strong> vers{' '}
            <code className="rounded bg-black/10 px-1 py-0.5 text-xs">api.sportmonks.com</code> — elles ne passent pas
            par ton hébergement. Le compteur d’usage se trouve sur le{' '}
            <strong className="text-tf-app-fg">tableau de bord SportMonks</strong> (MySportmonks), pas sur ton site.
          </p>
          <div
            className={cn(
              'max-w-2xl rounded-xl border px-4 py-3 text-sm font-semibold',
              tokenSource === 'none'
                ? L
                  ? 'border-amber-600/45 bg-amber-50 text-amber-950'
                  : 'border-amber-400/50 bg-amber-950/30 text-amber-100'
                : L
                  ? 'border-emerald-600/40 bg-emerald-50 text-emerald-950'
                  : 'border-emerald-400/40 bg-emerald-950/25 text-emerald-100',
            )}
            role="status"
          >
            {tokenSource === 'env' && (
              <>
                Jeton actif : <span className="text-tf-app-fg">fichier .env / build Vite</span> (
                <code className="font-mono text-xs">VITE_SPORTMONKS_TOKEN</code>). Pense à redémarrer{' '}
                <code className="font-mono text-xs">npm run dev</code> après modification ; en prod, refais un build
                déploiement.
              </>
            )}
            {tokenSource === 'browser' && (
              <>
                Jeton actif : <span className="text-tf-app-fg">ce navigateur</span> (localStorage). Les appels
                SportMonks sont bien envoyés tant que cette page et l’accueil chargent les matchs.
              </>
            )}
            {tokenSource === 'none' && (
              <>
                <strong className="text-tf-app-fg">Aucun jeton détecté</strong> — l’app n’envoie aucune requête à
                SportMonks et affiche des matchs de démo. En local :{' '}
                <code className="font-mono text-xs">VITE_SPORTMONKS_TOKEN</code> dans{' '}
                <code className="font-mono text-xs">.env.local</code> puis redémarrer le serveur. Sur le site déployé :
                la même variable sur <strong className="text-tf-app-fg">Vercel</strong> puis un redeploy. Pour toi seul
                sur cette machine : colle la clé ci-dessous puis Enregistrer.{' '}
                <a
                  href={SM_KEY_HASH}
                  className={cn('font-black underline underline-offset-2', L ? 'text-tf-electric-deep' : 'text-sky-200')}
                >
                  Aller au champ pour coller la clé
                </a>
              </>
            )}
          </div>
        </header>

        {err ? (
          <p
            className="mb-4 rounded-xl border border-rose-400/40 bg-rose-950/35 px-4 py-3 text-sm font-semibold text-rose-100"
            role="alert"
          >
            {err}
          </p>
        ) : null}
        {msg ? (
          <p className="mb-4 rounded-xl border border-emerald-400/35 bg-emerald-950/25 px-4 py-3 text-sm font-semibold text-emerald-100">
            {msg}
          </p>
        ) : null}

        <Card
          id="tf-sportmonks-cle"
          elevation="soft"
          className="mx-auto max-w-xl scroll-mt-24 space-y-4 p-5 sm:p-6"
        >
          <div>
            <h2 className="text-lg font-black text-tf-app-fg">Jeton</h2>
            <p className={cn('mt-1 text-xs leading-relaxed', label)}>
              MySportmonks → API → Tokens. Valeur brute pour le header <code className="font-mono">Authorization</code>{' '}
              (sans « Bearer »).
            </p>
            {envSm ? (
              <p className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-200/95">
                Variable <code className="font-mono">VITE_SPORTMONKS_TOKEN</code> déjà définie au build — elle prime sur
                le champ ci-dessous.
              </p>
            ) : browserSm ? (
              <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-200/90">
                Une clé est déjà enregistrée dans ce navigateur. Tu peux la remplacer en collant une nouvelle clé puis
                Enregistrer.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="tf-sm-token" className="text-xs font-black uppercase tracking-wide text-tf-app-fg">
                SportMonks
              </label>
              <button
                type="button"
                onClick={() => setShowSm((s) => !s)}
                className={cn('text-xs font-bold underline-offset-2 hover:underline', label, TF_FOCUS_VISIBLE)}
              >
                {showSm ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <input
              ref={tokenInputRef}
              id="tf-sm-token"
              name="sportmonks"
              autoComplete="off"
              spellCheck={false}
              type={showSm ? 'text' : 'password'}
              value={smDraft}
              onChange={(e) => setSmDraft(e.target.value)}
              placeholder="Coller le jeton ici puis Enregistrer…"
              className={cn(inputCls, TF_FOCUS_VISIBLE)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={saveSportMonks} disabled={envSm}>
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="soft"
              onClick={() => {
                setSmDraft('')
                setSportMonksTokenBrowser(null)
                setMsg('Clé SportMonks retirée du navigateur.')
                setErr(null)
              }}
              disabled={envSm}
            >
              Effacer (navigateur)
            </Button>
            <Button type="button" variant="ghost" onClick={testSportMonks} disabled={busySm}>
              {busySm ? 'Test…' : 'Tester la connexion'}
            </Button>
          </div>
        </Card>

        <p className={cn('mt-8 max-w-2xl text-xs leading-relaxed', label)}>
          Sans clé : l’app affiche des matchs de démo. En production, un backend qui relaie SportMonks évite d’exposer le
          jeton dans le navigateur.
        </p>
      </PageContainer>
    </div>
  )
}
