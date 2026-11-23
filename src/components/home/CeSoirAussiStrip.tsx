import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { HubStripUpcoming } from '../match/HubMatchEncart'
import { HubStripFinished } from '../match/HubMatchEncart'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'
import { useAppearance } from '../../contexts/AppearanceContext'

export function CeSoirAussiStrip({ matches }: { matches: Match[] }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  if (!matches.length) return null
  return (
    <div className={cn('min-w-0 border-t pt-2', L ? 'border-tf-dark/10' : 'border-white/10')}>
      <HubEncartTopAccent appearance={appearance} preset="upcoming" className="mb-2" />
      <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-tf-app-fg">Ce soir aussi</h3>
        <Link to="/match" className={cn(TF_FOCUS_VISIBLE, 'text-[11px] font-black text-sky-400 hover:underline')}>
          Calendrier
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {matches.map((m) =>
          m.status === 'finished' ? (
            <HubStripFinished key={m.id} match={m} className="min-w-0" />
          ) : (
            <HubStripUpcoming key={m.id} match={m} visualSize="minimal" className="min-w-0" />
          ),
        )}
      </div>
    </div>
  )
}
