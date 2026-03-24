import { Card } from '../components/ui/Card'
import { BettorLeaderboard } from '../components/home/BettorLeaderboard'

export function RankingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-black tracking-[0.2em] text-tf-grey">CLASSEMENTS</p>
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">
          Top parieurs & XP
        </h1>
        <p className="mt-1 text-sm font-semibold text-tf-grey">
          Classement communautaire (données mock) — à relier aux stats réelles plus tard.
        </p>
      </header>
      <Card className="p-5 sm:p-6" elevation="soft">
        <BettorLeaderboard />
      </Card>
    </div>
  )
}
