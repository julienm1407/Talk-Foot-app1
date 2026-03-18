export function LogoMark() {
  return (
    <div
      className="relative grid size-9 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(0,0,0,.35)]"
      aria-hidden="true"
    >
      <div className="absolute -inset-6 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(139,92,246,.75),rgba(34,197,94,.6),rgba(251,191,36,.65),rgba(139,92,246,.75))] opacity-60 blur-xl" />
      <div className="relative grid size-7 place-items-center rounded-xl bg-black/35 ring-1 ring-white/10">
        <span className="text-sm">⚽</span>
      </div>
    </div>
  )
}

