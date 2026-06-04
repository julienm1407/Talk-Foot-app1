/**
 * Répare les listes HTML invalides (ex. collage Word/Docs : texte directement dans `<ul>` sans `<li>`).
 * N’invente pas de contenu : restructure uniquement le texte déjà présent.
 */
export function normalizeArticleListHtml(html: string): string {
  if (!html.trim() || typeof DOMParser === 'undefined') return html

  const doc = new DOMParser().parseFromString(`<div id="tf-article-html-root">${html}</div>`, 'text/html')
  const root = doc.getElementById('tf-article-html-root')
  if (!root) return html

  root.querySelectorAll('ul, ol').forEach((list) => {
    if (list.querySelector(':scope > li')) return

    const text = (list.textContent ?? '').trim()
    if (!text) {
      list.remove()
      return
    }

    const parts = text
      .split(/\s*;\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean)

    const items = parts.length > 1 ? parts : [text]
    list.innerHTML = ''
    for (const part of items) {
      const li = doc.createElement('li')
      li.textContent = part
      list.appendChild(li)
    }
  })

  return root.innerHTML
}
