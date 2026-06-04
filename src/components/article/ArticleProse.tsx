import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

/** Classe racine du HTML markdown / paragraphes article. */
export const ARTICLE_PROSE_BODY_CLASS = 'tf-article-prose__body'

type Props = {
  children: ReactNode
  light?: boolean
  className?: string
}

/** Conteneur typographique article : H2/H3, paragraphes justifiés, contrastes accessibles. */
export function ArticleProse({ children, light = true, className }: Props) {
  return (
    <div
      className={cn('tf-article-prose w-full min-w-0', className)}
      data-tf-article-tone={light ? 'light' : 'dark'}
    >
      {children}
    </div>
  )
}
