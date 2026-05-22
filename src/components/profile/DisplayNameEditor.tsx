import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useDisplayNameChange } from '../../hooks/useDisplayNameChange'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { useAppearance } from '../../contexts/AppearanceContext'

export function DisplayNameEditor({
  className,
  variant = 'default',
}: {
  className?: string
  variant?: 'default' | 'compact'
}) {
  const { user } = useAuth()
  const { status, loading, applyChange, cooldownLabel } = useDisplayNameChange()
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const displayName = user?.displayName?.trim() || status?.displayName || 'Supporteur'
  const canChange = status?.canChange ?? true
  const remaining = status?.changesRemaining ?? 2

  useEffect(() => {
    if (!editing) setDraft(displayName)
  }, [displayName, editing])

  const cancel = () => {
    setEditing(false)
    setDraft(displayName)
    setError(null)
    setSuggestions([])
  }

  const submit = async () => {
    setError(null)
    setSuggestions([])
    const result = await applyChange(draft)
    if (result.ok) {
      setEditing(false)
      return
    }
    setError(result.message)
    if (result.error === 'taken' && result.suggestions?.length) {
      setSuggestions(result.suggestions)
    }
  }

  const nameClass =
    variant === 'compact'
      ? 'font-display text-lg font-black tracking-tight text-tf-app-fg sm:text-xl'
      : 'font-display text-2xl font-black tracking-tight text-tf-app-fg sm:text-3xl'

  if (!editing) {
    return (
      <div className={cn('min-w-0', className)}>
        <div className="flex flex-wrap items-center gap-2">
          {variant === 'compact' ? (
            <span className={nameClass}>{displayName}</span>
          ) : (
            <h2 className={nameClass}>{displayName}</h2>
          )}
          <button
            type="button"
            onClick={() => {
              if (!canChange) return
              setEditing(true)
            }}
            disabled={!canChange}
            className={cn(
              'rounded-xl border px-2.5 py-1 text-[11px] font-black transition',
              TF_FOCUS_VISIBLE,
              canChange
                ? L
                  ? 'border-tf-dark/15 bg-white text-tf-dark hover:bg-tf-electric-soft'
                  : 'border-white/15 bg-white/10 text-sky-100 hover:bg-white/15'
                : 'cursor-not-allowed border-white/10 bg-white/5 text-white/40 opacity-60',
            )}
            title={
              canChange
                ? 'Modifier ton pseudo'
                : cooldownLabel
                  ? `Prochain changement ${cooldownLabel}`
                  : 'Limite de changements atteinte'
            }
          >
            Modifier
          </button>
        </div>
        <p className="mt-1 text-xs font-semibold text-tf-app-muted">
          {canChange
            ? `${remaining} changement${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''} · pseudo unique`
            : cooldownLabel
              ? `Changement possible ${cooldownLabel} (2 max. par période de 14 jours)`
              : '2 changements max. puis pause de 14 jours'}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      <label htmlFor="profile-display-name" className="text-[11px] font-black uppercase tracking-wide text-tf-app-muted">
        Nouveau pseudo
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="profile-display-name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoComplete="username"
          className="min-w-[12rem] max-w-full flex-1 rounded-xl"
          maxLength={24}
        />
        <Button type="button" variant="primary" className="shrink-0 text-sm" disabled={loading} onClick={() => void submit()}>
          {loading ? '…' : 'Enregistrer'}
        </Button>
        <Button type="button" variant="ghost" className="shrink-0 text-sm" onClick={cancel}>
          Annuler
        </Button>
      </div>
      {error ? (
        <p className="text-xs font-semibold text-rose-500" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-[11px] font-medium text-tf-app-muted">
          2–24 caractères · chaque pseudo est unique sur Talk Foot
        </p>
      )}
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setDraft(s)
                setError(null)
                setSuggestions([])
              }}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] font-bold transition',
                TF_FOCUS_VISIBLE,
                L
                  ? 'border-tf-electric/30 bg-sky-50 text-tf-dark hover:bg-sky-100'
                  : 'border-sky-400/30 bg-sky-950/50 text-sky-100 hover:bg-sky-900/60',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
