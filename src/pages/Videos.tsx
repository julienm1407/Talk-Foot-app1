import { Card } from '../components/ui/Card'
import { cn } from '../utils/cn'
import { getAppSectionTheme } from '../theme/appSectionThemes'

export function VideosPage() {
  const th = getAppSectionTheme('videos')
  return (
    <div className="space-y-6">
      <header className={cn('border-b pb-4', th.page.borderBottomClass)}>
        <p className={cn('text-[11px] font-black uppercase tracking-[0.2em]', th.page.eyebrowClass)}>
          Vidéos
        </p>
        <h1 className="mt-2 font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">
          Extraits & replays
        </h1>
        <p className="mt-1 text-sm font-semibold text-tf-grey">
          Bientôt : buts, analyses et contenus courts liés aux matchs.
        </p>
      </header>
      <Card className="p-8 text-center" elevation="soft">
        <p className="text-sm font-bold text-tf-grey">
          Le hub vidéo arrive — les flux seront branchés ici.
        </p>
      </Card>
    </div>
  )
}
