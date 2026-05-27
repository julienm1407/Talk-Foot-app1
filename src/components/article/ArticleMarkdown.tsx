import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: false,
})

function toSafeHtml(markdown: string): string {
  const raw = marked.parse(markdown) as string
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
  })
}

export function ArticleMarkdown({
  markdown,
  className,
}: {
  markdown: string
  className?: string
}) {
  const safeHtml = useMemo(() => toSafeHtml(markdown), [markdown])
  return (
    <div
      className={className}
      // Markdown rendu puis sanitizé avant injection.
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
