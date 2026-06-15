import { Card } from '../ui/Card'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'
import type { ProfileIdentityLine } from '../../utils/profileIdentity'

function profileIncard(light: boolean) {
  return cn(
    'border',
    light
      ? 'border-tf-dark/10 bg-white/88 shadow-[0_1px_0_rgba(1,30,51,0.05)]'
      : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
  )
}

export function ProfileIdentitySection({
  lines,
  title = 'Ton identité Talk Foot',
  subtitle = 'Qui tu es sur Talk Foot — faits marquants tirés de ton activité réelle.',
  loading = false,
}: {
  lines: ProfileIdentityLine[]
  title?: string
  subtitle?: string
  loading?: boolean
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const incard = profileIncard(L)

  return (
    <Card id="identite" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
      <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">IDENTITÉ</div>
      <div className="mt-0.5 font-display text-lg font-black tracking-tight text-tf-app-fg">{title}</div>
      <p className="mt-1 text-sm font-semibold text-tf-app-muted">{subtitle}</p>

      {loading ? (
        <p className="mt-4 text-sm font-semibold text-tf-app-muted">Chargement…</p>
      ) : lines.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed px-4 py-5 text-sm font-semibold text-tf-app-muted">
          Parie, rejoins une tribune, crée ton groupe… ton histoire Talk Foot commence ici.
        </p>
      ) : (
        <ul className="mt-4 space-y-2" role="list">
          {lines.map((line) => (
            <li
              key={line.id}
              className={cn(
                'flex items-start gap-3 rounded-2xl px-4 py-3',
                incard,
                line.featured &&
                  (L
                    ? 'ring-1 ring-amber-200/80 bg-gradient-to-r from-amber-50/90 to-white/90'
                    : 'ring-1 ring-amber-500/25 bg-gradient-to-r from-amber-950/40 to-transparent'),
              )}
            >
              <span className="text-lg leading-none" aria-hidden>
                {line.emoji}
              </span>
              <span className="text-sm font-bold leading-snug text-tf-app-fg">{line.label}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
