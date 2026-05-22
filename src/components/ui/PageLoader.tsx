/** Fallback léger pendant le chargement d’une route (code splitting). */
export function PageLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="size-9 animate-spin rounded-full border-2 border-tf-cta/30 border-t-tf-cta"
        aria-hidden
      />
      <p className="text-sm font-semibold text-tf-grey">{label}</p>
    </div>
  )
}
