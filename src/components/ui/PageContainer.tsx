import { cn } from '../../utils/cn'

type MaxWidth = 'content' | 'wide' | 'ultra' | 'sm' | 'none' | 'article' | 'articleInner'

const maxW: Record<MaxWidth, string> = {
  none: 'max-w-none',
  sm: 'max-w-tf-sm',
  content: 'max-w-tf-content',
  wide: 'max-w-tf-wide',
  ultra: 'max-w-tf-ultra',
  article: 'max-w-tf-article-body',
  articleInner: 'max-w-tf-article-inner',
}

/**
 * Conteneur de page : gouttières et largeur max cohérentes (mobile-first).
 */
export function PageContainer({
  children,
  className,
  maxWidth = 'content',
  as: Comp = 'div',
}: {
  children: React.ReactNode
  className?: string
  maxWidth?: MaxWidth
  as?: 'div' | 'section' | 'article'
}) {
  return (
    <Comp
      className={cn(
        'mx-auto w-full min-w-0 px-[var(--tf-page-gutter)] sm:px-[var(--tf-page-gutter)]',
        maxW[maxWidth],
        className,
      )}
    >
      {children}
    </Comp>
  )
}
