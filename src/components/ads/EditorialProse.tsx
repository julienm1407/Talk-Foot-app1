import { cn } from '../../utils/cn'

type Props = {
  title?: string
  paragraphs: string[]
  className?: string
  light?: boolean
}

/** Bloc texte éditorial (valeur informative pour crawlers + conformité AdSense). */
export function EditorialProse({ title, paragraphs, className, light }: Props) {
  return (
    <section
      className={cn('rounded-2xl border px-4 py-4 sm:px-5 sm:py-5', className)}
      aria-label={title ?? 'À propos de cette page'}
    >
      {title ? (
        <h2
          className={cn(
            'font-display text-sm font-black uppercase tracking-[0.12em]',
            light ? 'text-tf-dark' : 'text-sky-100',
          )}
        >
          {title}
        </h2>
      ) : null}
      <div className={cn('space-y-3', title ? 'mt-3' : '')}>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className={cn(
              'max-w-[68ch] text-sm font-medium leading-relaxed',
              light ? 'text-tf-dark/80' : 'text-sky-100/88',
            )}
          >
            {p}
          </p>
        ))}
      </div>
    </section>
  )
}
