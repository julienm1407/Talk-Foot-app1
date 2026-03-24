import { Card } from '../components/ui/Card'

export function VideosPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-black tracking-[0.2em] text-tf-grey">VIDÉOS</p>
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">
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
