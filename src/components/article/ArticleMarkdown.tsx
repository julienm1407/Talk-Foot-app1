import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: false,
})

function withEditorShortcodes(markdown: string): string {
  return markdown
    .replace(/\[\[spacer-sm\]\]/g, '<div class="tf-md-spacer tf-md-spacer-sm" aria-hidden="true"></div>')
    .replace(/\[\[spacer-md\]\]/g, '<div class="tf-md-spacer tf-md-spacer-md" aria-hidden="true"></div>')
    .replace(/\[\[spacer-lg\]\]/g, '<div class="tf-md-spacer tf-md-spacer-lg" aria-hidden="true"></div>')
    .replace(/\[\[bloc-sm:([^\]]+)\]\]/g, '<div class="tf-md-block tf-md-block-sm"><p>$1</p></div>')
    .replace(/\[\[bloc-md:([^\]]+)\]\]/g, '<div class="tf-md-block tf-md-block-md"><p>$1</p></div>')
    .replace(/\[\[bloc-lg:([^\]]+)\]\]/g, '<div class="tf-md-block tf-md-block-lg"><p>$1</p></div>')
}

function toSafeHtml(markdown: string): string {
  const prepared = withEditorShortcodes(markdown)
  const raw = marked.parse(prepared) as string
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel', 'class', 'aria-hidden'],
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
