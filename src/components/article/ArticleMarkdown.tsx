import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { cn } from '../../utils/cn'
import { ARTICLE_PROSE_BODY_CLASS } from './ArticleProse'
import { normalizeArticleListHtml } from '../../utils/normalizeArticleListHtml'

marked.setOptions({
  gfm: true,
  breaks: true,
})

function withEditorShortcodes(markdown: string): string {
  return markdown
    .replace(/\[\[spacer-sm\]\]/g, '<div class="tf-md-spacer tf-md-spacer-sm" aria-hidden="true"></div>')
    .replace(/\[\[spacer-md\]\]/g, '<div class="tf-md-spacer tf-md-spacer-md" aria-hidden="true"></div>')
    .replace(/\[\[spacer-lg\]\]/g, '<div class="tf-md-spacer tf-md-spacer-lg" aria-hidden="true"></div>')
    .replace(/\[\[bloc-sm:([^\]]+)\]\]/g, '<div class="tf-md-block tf-md-block-sm"><p>$1</p></div>')
    .replace(/\[\[bloc-md:([^\]]+)\]\]/g, '<div class="tf-md-block tf-md-block-md"><p>$1</p></div>')
    .replace(/\[\[bloc-lg:([^\]]+)\]\]/g, '<div class="tf-md-block tf-md-block-lg"><p>$1</p></div>')
    .replace(/\[\[txt-sm:([^\]]+)\]\]/g, '<span class="tf-md-text-sm">$1</span>')
    .replace(/\[\[txt-md:([^\]]+)\]\]/g, '<span class="tf-md-text-md">$1</span>')
    .replace(/\[\[txt-lg:([^\]]+)\]\]/g, '<span class="tf-md-text-lg">$1</span>')
}

function isArticleHtmlPayload(content: string): boolean {
  const t = content.trim()
  return t.startsWith('<') && /<(p|h[1-6]|ul|ol|li|div|blockquote|strong|em)\b/i.test(t)
}

function toSafeHtml(markdown: string): string {
  const prepared = withEditorShortcodes(markdown)
  const raw = isArticleHtmlPayload(prepared)
    ? normalizeArticleListHtml(prepared)
    : normalizeArticleListHtml(marked.parse(prepared) as string)
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
      className={cn(ARTICLE_PROSE_BODY_CLASS, className)}
      // Markdown rendu puis sanitizé avant injection.
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
