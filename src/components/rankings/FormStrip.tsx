import type { FormResult } from '../../types/standings'
import { cn } from '../../utils/cn'

const meta: Record<FormResult, { label: string; className: string }> = {
  W: { label: 'V', className: 'bg-emerald-500 text-white' },
  D: { label: 'N', className: 'bg-amber-400 text-amber-950' },
  L: { label: 'D', className: 'bg-slate-300 text-slate-800' },
}

export function FormStrip({ form, className }: { form: FormResult[]; className?: string }) {
  // Affichage le plus récent à gauche (plus lisible pour les users).
  const display = [...form].reverse()
  const aria = display
    .map((r) => (r === 'W' ? 'Victoire' : r === 'D' ? 'Nul' : 'Défaite'))
    .join(', ')

  return (
    <div className={cn('flex gap-0.5', className)} role="img" aria-label={`Forme récente : ${aria}`}>
      {display.map((r, i) => (
        <span
          key={i}
          className={cn(
            'flex size-5 items-center justify-center rounded text-[9px] font-black',
            meta[r].className,
          )}
          title={r === 'W' ? 'Victoire' : r === 'D' ? 'Nul' : 'Défaite'}
        >
          {meta[r].label}
        </span>
      ))}
    </div>
  )
}
