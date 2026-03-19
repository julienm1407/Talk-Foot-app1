import { FOOTBALL_GIFS } from '../../data/gifs'
import { cn } from '../../utils/cn'

export function GifPicker({
  onSelect,
  onClose,
  className,
}: {
  onSelect: (url: string) => void
  onClose: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'absolute bottom-full left-0 right-0 mb-2 max-h-[200px] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-black tracking-wide text-slate-700">GIFs</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-800"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {FOOTBALL_GIFS.map((g) => (
          <button
            key={g.id}
            type="button"
            className="overflow-hidden rounded-xl border border-slate-200/60 transition hover:ring-2 hover:ring-tf-grey/40 focus:outline-none focus:ring-2 focus:ring-tf-grey/40"
            onClick={() => onSelect(g.url)}
            aria-label={g.title}
          >
            <img
              src={g.url}
              alt={g.title}
              className="h-16 w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
