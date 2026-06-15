import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { BadgeIllustration } from './BadgeIllustration'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'
import type { PronoBadge, PronoProgress } from '../../utils/pronoStatsFromBets'

function profileIncard(light: boolean) {
  return cn(
    'border',
    light
      ? 'border-tf-dark/10 bg-white/88 shadow-[0_1px_0_rgba(1,30,51,0.05)]'
      : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
  )
}

export function ProfilePronoStatsSection({
  badges,
  progress,
  badgesTitle = 'Tes badges',
  loading = false,
}: {
  badges: PronoBadge[]
  progress: PronoProgress
  badgesTitle?: string
  loading?: boolean
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const incard = profileIncard(L)

  return (
    <>
      <Card id="badges-pronos" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
        <div>
          <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">BADGES PRONOS</div>
          <div className="mt-0.5 font-display text-lg font-black tracking-tight text-tf-app-fg">
            {badgesTitle}
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm font-semibold text-tf-app-muted">Chargement des stats…</p>
        ) : (
          <div className="mt-4 grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b) => (
              <div key={b.label} className={cn('rounded-3xl p-4', incard)} title={b.hint}>
                <div className="flex items-start gap-3">
                  <BadgeIllustration kind={b.kind} />
                  <div className="min-w-0">
                    <div className="text-sm font-black text-tf-app-fg">{b.label}</div>
                    <div className="mt-2">
                      <Badge tone={b.tone ?? 'neutral'} className={b.className}>
                        Débloqué
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card id="progression" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
        <div>
          <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">PROGRESSION</div>
          <div className="mt-0.5 font-display text-lg font-black tracking-tight text-tf-app-fg">
            Prochains paliers
          </div>
        </div>

        <div className="mt-4 space-y-2 sm:space-y-3">
          <div className={cn('rounded-3xl p-4', incard)}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-tf-app-fg">{progress.predictor.label}</div>
              <div className="text-xs font-bold text-tf-app-muted">
                {progress.predictor.cur}/{progress.predictor.next}
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.predictor.pct} tone="blue" />
            </div>
          </div>

          <div className={cn('rounded-3xl p-4', incard)}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-tf-app-fg">{progress.accuracy.label}</div>
              <div className="text-xs font-bold text-tf-app-muted">
                {progress.accuracy.cur}/{progress.accuracy.next}%
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.accuracy.pct} tone="emerald" />
            </div>
          </div>

          <div className={cn('rounded-3xl p-4', incard)}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-tf-app-fg">{progress.streak.label}</div>
              <div className="text-xs font-bold text-tf-app-muted">
                {progress.streak.cur}/{progress.streak.next}
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.streak.pct} tone="amber" />
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}
