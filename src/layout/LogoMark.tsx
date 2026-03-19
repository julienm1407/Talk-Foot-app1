export function LogoMark() {
  return (
    <div
      className="relative grid size-9 place-items-center overflow-hidden rounded-2xl border border-tf-grey-pastel/40 bg-tf-dark/5 shadow-[0_10px_32px_rgba(1,30,51,.2)]"
      aria-hidden="true"
    >
      <div className="absolute -inset-6 bg-[conic-gradient(from_180deg_at_50%_50%,#5d86a2,rgba(179,195,207,.7),#5d86a2)] opacity-50 blur-xl" />
      <div className="relative grid size-7 place-items-center rounded-xl bg-tf-dark/80 ring-1 ring-tf-grey-pastel/30">
        <span className="text-sm">⚽</span>
      </div>
    </div>
  )
}

