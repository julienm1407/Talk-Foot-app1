import { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent } from 'react'
import { Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { ArticleMarkdown } from '../components/article/ArticleMarkdown'
import { useAuth } from '../contexts/AuthContext'
import {
  createDraftArticle,
  deleteDraftArticle,
  listAdminArticles,
  moveArticleToReview,
  publishArticle,
  scheduleArticle,
  unpublishArticle,
  updateDraftArticle,
  type AdminArticle,
  type AdminArticleDraftInput,
} from '../lib/supabase/articles'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { uploadArticleImage } from '../lib/supabase/articleMedia'
import {
  fetchArticleDashboardStats,
  type ArticleDashboardStats,
} from '../lib/supabase/articleAnalytics'
import {
  fetchCommentsForModeration,
  moderateComment,
  type ArticleComment,
} from '../lib/supabase/articleComments'
import {
  fetchEditorialUsers,
  upsertEditorialUser,
  type EditorialRole,
} from '../lib/supabase/editorialRoles'
import {
  createNewsletterCampaign,
  fetchNewsletterCampaigns,
  type NewsletterCampaign,
} from '../lib/supabase/newsletter'
import { fetchRefundRequests, updateRefundRequestStatus, type RefundRequestRow } from '../lib/supabase/refundRequests'
import { AdminSectionNav } from '../components/admin/AdminSectionNav'
import {
  refundStatusLabel,
  stripeDashboardUrl,
  type AdminSectionId,
} from '../components/admin/adminSections'
import { cn } from '../utils/cn'
import { resolveArticleExcerpt } from '../utils/articleExcerpt'
import { normalizeArticleListHtml } from '../utils/normalizeArticleListHtml'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'

type FormState = {
  id?: string
  title: string
  slug: string
  excerpt: string
  tag: AdminArticleDraftInput['tag']
  authorName: string
  coverImageUrl: string
  leagueIds: string
  clubIds: string
  bodyMarkdown: string
  scheduledAt: string
  reviewedBy: string
}

type MarkdownImageToken = {
  index: number
  alt: string
  url: string
  raw: string
}

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  tag: 'Analyse',
  authorName: '',
  coverImageUrl: '',
  leagueIds: '',
  clubIds: '',
  bodyMarkdown: '',
  scheduledAt: '',
  reviewedBy: '',
}

const ARTICLE_TEMPLATES: Array<{ id: string; label: string; markdown: string }> = [
  {
    id: 'debrief-match',
    label: 'Débrief match',
    markdown:
      '## Contexte du match\n\nRappelle l’enjeu, la forme des équipes et les absences clés.\n\n## Temps forts\n\n- 1re période\n- 2e période\n- Tournant du match\n\n## Analyse tactique\n\nExplique les ajustements et les zones décisives.\n\n## Ce qu’il faut retenir\n\nTrois points concrets pour les supporters.',
  },
  {
    id: 'rumeur-transfert',
    label: 'Rumeur transfert',
    markdown:
      '## Ce que l’on sait\n\nSources, niveau de fiabilité et contexte du club.\n\n## Points de vigilance\n\nCe qui reste à confirmer.\n\n## Impact potentiel\n\nConséquences sportives et économiques.',
  },
  {
    id: 'analyse-tactique',
    label: 'Analyse tactique',
    markdown:
      '## Plan de jeu\n\nDécris le système et l’intention collective.\n\n## Clé côté ballon\n\nOrganisation offensive et circuits préférentiels.\n\n## Clé sans ballon\n\nPressing, bloc et gestion des transitions.\n\n## Conclusion\n\nCe que cela implique pour le prochain match.',
  },
]

function computeSeoScore(form: FormState): { score: number; tips: string[] } {
  let score = 0
  const tips: string[] = []
  const titleLen = form.title.trim().length
  const excerptLen = form.excerpt.trim().length
  const hasH2 = /(^|\n)##\s+/m.test(form.bodyMarkdown)
  const hasImage = /!\[[^\]]*\]\([^)]+\)/.test(form.bodyMarkdown) || Boolean(form.coverImageUrl.trim())
  const slugWords = form.slug.split('-').filter(Boolean).length

  if (titleLen >= 35 && titleLen <= 68) score += 25
  else tips.push('Titre conseillé entre 35 et 68 caractères.')
  if (excerptLen >= 120 && excerptLen <= 180) score += 25
  else tips.push('Extrait conseillé entre 120 et 180 caractères.')
  if (form.slug.trim().length >= 8 && slugWords >= 3) score += 15
  else tips.push('Slug plus descriptif (au moins 3 mots).')
  if (hasH2) score += 15
  else tips.push('Ajoute des sous-titres (##) pour structurer l’article.')
  if (hasImage) score += 10
  else tips.push('Ajoute une image de couverture ou une image dans le contenu.')
  if (form.bodyMarkdown.trim().length >= 500) score += 10
  else tips.push('Corps un peu court, vise au moins 500 caractères.')

  return { score: Math.min(100, score), tips }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function extractMarkdownImages(markdown: string): MarkdownImageToken[] {
  const re = /!\[([^\]]*)\]\(([^)\s]+)\)/g
  const out: MarkdownImageToken[] = []
  let match: RegExpExecArray | null = re.exec(markdown)
  let index = 0
  while (match) {
    out.push({
      index,
      alt: (match[1] || '').trim(),
      url: (match[2] || '').trim(),
      raw: match[0],
    })
    index += 1
    match = re.exec(markdown)
  }
  return out
}

function sanitizeRichHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'h2',
      'h3',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  }).trim()
  return normalizeArticleListHtml(sanitized)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function plainTextToStructuredHtml(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  let paragraph: string[] = []
  let listTag: 'ul' | 'ol' | null = null
  let listItems: string[] = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    out.push(`<p>${paragraph.map((x) => escapeHtml(x)).join('<br />')}</p>`)
    paragraph = []
  }

  const flushList = () => {
    if (!listTag || !listItems.length) {
      listTag = null
      listItems = []
      return
    }
    out.push(
      `<${listTag}>${listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${listTag}>`,
    )
    listTag = null
    listItems = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      flushParagraph()
      continue
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/)
    const ordered = line.match(/^\d+[.)]\s+(.+)$/)
    if (bullet || ordered) {
      flushParagraph()
      const tag = ordered ? 'ol' : 'ul'
      const item = (bullet?.[1] ?? ordered?.[1] ?? '').trim()
      if (listTag && listTag !== tag) flushList()
      listTag = tag
      listItems.push(item)
      continue
    }

    flushList()

    if (/^#{1,6}\s+/.test(line)) {
      flushParagraph()
      const level = Math.min(3, Math.max(2, (line.match(/^#+/)?.[0].length ?? 2)))
      const title = line.replace(/^#{1,6}\s+/, '').trim()
      out.push(`<h${level}>${escapeHtml(title)}</h${level}>`)
      continue
    }
    if (/^[A-ZÀ-Ý0-9][A-ZÀ-Ý0-9\s'’\-:!?]{8,}$/.test(line) && !line.endsWith(';')) {
      flushParagraph()
      out.push(`<h2>${escapeHtml(line)}</h2>`)
      continue
    }
    paragraph.push(line)
  }

  flushList()
  flushParagraph()
  return out.join('')
}

function formFromArticle(article: AdminArticle): FormState {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    tag: article.tag,
    authorName: article.authorName,
    coverImageUrl: article.coverImageUrl ?? '',
    leagueIds: article.leagueIds.join(', '),
    clubIds: article.clubIds.join(', '),
    bodyMarkdown: article.bodyMarkdown,
    scheduledAt: article.scheduledAt ? article.scheduledAt.slice(0, 16) : '',
    reviewedBy: article.reviewedBy ?? '',
  }
}

function draftInputFromForm(form: FormState): AdminArticleDraftInput {
  return {
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    tag: form.tag,
    bodyMarkdown: form.bodyMarkdown,
    authorName: form.authorName,
    coverImageUrl: form.coverImageUrl || null,
    leagueIds: parseCsv(form.leagueIds),
    clubIds: parseCsv(form.clubIds),
  }
}

export function AdminPage() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<AdminArticle[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false)
  const markdownRef = useRef<HTMLTextAreaElement>(null)
  const richEditorRef = useRef<HTMLDivElement>(null)
  const [dashboard, setDashboard] = useState<ArticleDashboardStats | null>(null)
  const [commentsToModerate, setCommentsToModerate] = useState<ArticleComment[]>([])
  const [editorialUsers, setEditorialUsers] = useState<Array<{ email: string; role: EditorialRole }>>([])
  const [roleEmail, setRoleEmail] = useState('')
  const [roleValue, setRoleValue] = useState<EditorialRole>('redacteur')
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([])
  const [refundRequests, setRefundRequests] = useState<RefundRequestRow[]>([])
  const [campaignTitle, setCampaignTitle] = useState('')
  const [campaignSubject, setCampaignSubject] = useState('')
  const [campaignBody, setCampaignBody] = useState('')
  const [activeSection, setActiveSection] = useState<AdminSectionId>('overview')

  const sb = useMemo(() => getSupabaseBrowserClient(), [])

  const selected = useMemo(
    () => articles.find((a) => a.id === selectedId) ?? null,
    [articles, selectedId],
  )
  const seoAudit = useMemo(() => computeSeoScore(form), [form])
  const markdownImages = useMemo(() => extractMarkdownImages(form.bodyMarkdown), [form.bodyMarkdown])
  const pendingRefundCount = useMemo(
    () => refundRequests.filter((r) => r.status === 'pending' || r.status === 'in_progress').length,
    [refundRequests],
  )
  const moderationAlertCount = useMemo(
    () => commentsToModerate.filter((c) => c.reportedCount > 0 || c.status === 'pending').length,
    [commentsToModerate],
  )
  const sectionBadges = useMemo(
    () => ({
      moderation: moderationAlertCount,
      operations: pendingRefundCount,
    }),
    [moderationAlertCount, pendingRefundCount],
  )

  const statusLabel = useCallback((status: AdminArticle['status']) => {
    if (status === 'published') return 'Publié'
    if (status === 'review') return 'En relecture'
    if (status === 'scheduled') return 'Planifié'
    return 'Brouillon'
  }, [])

  const canSave =
    form.title.trim().length >= 4 &&
    form.slug.trim().length >= 4 &&
    form.excerpt.trim().length >= 8 &&
    form.bodyMarkdown.trim().length >= 24

  const refresh = useCallback(async () => {
    if (!sb || !isSupabaseConfigured()) {
      setLoading(false)
      setError('Supabase non configuré.')
      return
    }
    setLoading(true)
    const rows = await listAdminArticles(sb)
    setArticles(rows)
    const stats = await fetchArticleDashboardStats(sb)
    setDashboard(stats)
    const [comments, roles, newsletter, refunds] = await Promise.all([
      fetchCommentsForModeration(sb),
      fetchEditorialUsers(sb),
      fetchNewsletterCampaigns(sb),
      fetchRefundRequests(sb),
    ])
    setCommentsToModerate(comments)
    setEditorialUsers(roles)
    setCampaigns(newsletter)
    setRefundRequests(refunds)
    setLoading(false)
  }, [sb])

  useEffect(() => {
    const id = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(id)
  }, [refresh])

  useEffect(() => {
    if (!form.id || !canSave || !sb) return
    const t = window.setTimeout(() => {
      void (async () => {
        setStatus('saving')
        const saved = await updateDraftArticle(sb, form.id!, draftInputFromForm(form))
        if (!saved) {
          setStatus('error')
          return
        }
        setArticles((prev) => [saved, ...prev.filter((x) => x.id !== saved.id)])
        setStatus('saved')
      })()
    }, 900)
    return () => window.clearTimeout(t)
  }, [form, canSave, sb])

  const createNew = async () => {
    if (!sb) return
    const next = {
      ...EMPTY_FORM,
      title: 'Nouveau brouillon',
      slug: `article-${Date.now()}`,
      excerpt: '',
      bodyMarkdown:
        '## Introduction\n\nPremier paragraphe : contexte et accroche en 2–3 phrases.\n\n## Développement\n\nDétaille les faits, l’analyse ou le récit. Un paragraphe par idée.\n\n## À retenir\n\n- Point clé 1\n- Point clé 2\n- Point clé 3',
      authorName: user?.displayName || user?.email || 'Talk Foot',
    }
    const created = await createDraftArticle(sb, draftInputFromForm(next))
    if (!created) {
      setError(
        'Impossible de créer le brouillon. Vérifie que ton compte est bien admin dans Supabase (table admin_users).',
      )
      return
    }
    setArticles((prev) => [created, ...prev])
    setSelectedId(created.id)
    setForm(formFromArticle(created))
    setStatus('saved')
    setError(null)
  }

  const saveNow = async () => {
    if (!sb || !canSave) return
    setStatus('saving')
    if (!form.id) {
      const created = await createDraftArticle(sb, draftInputFromForm(form))
      if (!created) {
        setStatus('error')
        setError(
          'Sauvegarde refusée. Vérifie les droits admin de ton email dans Supabase (table admin_users).',
        )
        return
      }
      setForm(formFromArticle(created))
      setSelectedId(created.id)
      setArticles((prev) => [created, ...prev])
      setStatus('saved')
      return
    }
    const updated = await updateDraftArticle(sb, form.id, draftInputFromForm(form))
    if (!updated) {
      setStatus('error')
      setError(
        'Sauvegarde refusée. Vérifie les droits admin de ton email dans Supabase (table admin_users).',
      )
      return
    }
    setArticles((prev) => [updated, ...prev.filter((x) => x.id !== updated.id)])
    setStatus('saved')
  }

  const publishCurrent = async () => {
    if (!sb || !form.id) return
    const published = await publishArticle(sb, form.id)
    if (!published) return
    setArticles((prev) => [published, ...prev.filter((x) => x.id !== published.id)])
    setForm(formFromArticle(published))
    setStatus('saved')
  }

  const moveCurrentToReview = async () => {
    if (!sb || !form.id) return
    const next = await moveArticleToReview(
      sb,
      form.id,
      form.reviewedBy || user?.displayName || user?.email || undefined,
    )
    if (!next) return
    setArticles((prev) => [next, ...prev.filter((x) => x.id !== next.id)])
    setForm(formFromArticle(next))
    setStatus('saved')
  }

  const scheduleCurrent = async () => {
    if (!sb || !form.id || !form.scheduledAt) return
    const iso = new Date(form.scheduledAt).toISOString()
    const next = await scheduleArticle(sb, form.id, iso)
    if (!next) return
    setArticles((prev) => [next, ...prev.filter((x) => x.id !== next.id)])
    setForm(formFromArticle(next))
    setStatus('saved')
  }

  const unpublishCurrent = async () => {
    if (!sb || !form.id) return
    const draft = await unpublishArticle(sb, form.id)
    if (!draft) return
    setArticles((prev) => [draft, ...prev.filter((x) => x.id !== draft.id)])
    setForm(formFromArticle(draft))
    setStatus('saved')
  }

  const deleteCurrent = async () => {
    if (!sb || !form.id) return
    const ok = await deleteDraftArticle(sb, form.id)
    if (!ok) return
    setArticles((prev) => prev.filter((x) => x.id !== form.id))
    setForm(EMPTY_FORM)
    setSelectedId(null)
    setStatus('idle')
  }

  const handleImageUpload = async (file: File | null) => {
    if (!file || !sb) return
    setUploadingImage(true)
    const publicUrl = await uploadArticleImage(sb, file, form.slug || undefined)
    setUploadingImage(false)
    if (!publicUrl) {
      setStatus('error')
      setError('Import image impossible. Vérifie les policies storage et le bucket.')
      return
    }
    const alt = (form.title || 'Illustration').trim()
    const md = `\n\n![${alt}](${publicUrl})\n`
    const textarea = markdownRef.current
    if (!textarea) {
      setForm((p) => ({ ...p, bodyMarkdown: `${p.bodyMarkdown}${md}` }))
      return
    }
    const start = textarea.selectionStart ?? textarea.value.length
    const end = textarea.selectionEnd ?? textarea.value.length
    setForm((p) => ({
      ...p,
      bodyMarkdown: `${p.bodyMarkdown.slice(0, start)}${md}${p.bodyMarkdown.slice(end)}`,
    }))
  }

  const handleCoverImageUpload = async (file: File | null) => {
    if (!file || !sb) return
    setUploadingCoverImage(true)
    const publicUrl = await uploadArticleImage(sb, file, form.slug || undefined)
    setUploadingCoverImage(false)
    if (!publicUrl) {
      setStatus('error')
      setError('Import image de couverture impossible. Vérifie les policies storage et le bucket.')
      return
    }
    setForm((p) => ({ ...p, coverImageUrl: publicUrl }))
    setError(null)
  }

  const removeMarkdownImageByIndex = (targetIndex: number) => {
    let seen = -1
    const nextBody = form.bodyMarkdown.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (raw) => {
      seen += 1
      return seen === targetIndex ? '' : raw
    })
    setForm((p) => ({ ...p, bodyMarkdown: nextBody.replace(/\n{3,}/g, '\n\n').trim() }))
  }

  const replaceMarkdownImageByIndex = async (targetIndex: number, file: File | null) => {
    if (!file || !sb) return
    const publicUrl = await uploadArticleImage(sb, file, form.slug || undefined)
    if (!publicUrl) {
      setStatus('error')
      setError('Remplacement image impossible. Vérifie les policies storage et le bucket.')
      return
    }
    let seen = -1
    const nextBody = form.bodyMarkdown.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_raw, alt: string, _url: string) => {
      seen += 1
      if (seen !== targetIndex) return _raw
      const safeAlt = (alt || form.title || 'Illustration').trim()
      return `![${safeAlt}](${publicUrl})`
    })
    setForm((p) => ({ ...p, bodyMarkdown: nextBody }))
    setError(null)
  }

  const insertLayoutTemplate = (markdown: string) => {
    const content = form.bodyMarkdown.trim()
    const next = content ? `${content}\n\n${markdown.trim()}` : markdown.trim()
    setForm((p) => ({ ...p, bodyMarkdown: next }))
  }

  const pasteRichTextAsHtml = () => {
    const html = richEditorRef.current?.innerHTML ?? ''
    const cleaned = sanitizeRichHtml(html)
    if (!cleaned) return
    setForm((p) => ({ ...p, bodyMarkdown: cleaned }))
  }

  const clearRichEditor = () => {
    if (richEditorRef.current) richEditorRef.current.innerHTML = ''
  }

  const handlePasteInRichEditor = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    const incoming = html?.trim()
      ? sanitizeRichHtml(html)
      : sanitizeRichHtml(
          plainTextToStructuredHtml(text),
        )
    if (!incoming) return
    document.execCommand('insertHTML', false, incoming)
  }

  const wrapMarkdownSelection = (prefix: string, suffix = '', placeholder = 'texte') => {
    const textarea = markdownRef.current
    const source = form.bodyMarkdown
    if (!textarea) {
      setForm((p) => ({ ...p, bodyMarkdown: `${p.bodyMarkdown}${prefix}${placeholder}${suffix}` }))
      return
    }
    const start = textarea.selectionStart ?? source.length
    const end = textarea.selectionEnd ?? source.length
    const selected = source.slice(start, end)
    const content = selected || placeholder
    const next = `${source.slice(0, start)}${prefix}${content}${suffix}${source.slice(end)}`
    setForm((p) => ({ ...p, bodyMarkdown: next }))
  }

  const hideComment = async (commentId: string) => {
    if (!sb) return
    const ok = await moderateComment(sb, { commentId, status: 'hidden', reason: 'Modération admin' })
    if (!ok) return
    setCommentsToModerate((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, status: 'hidden' } : c)),
    )
  }

  const publishComment = async (commentId: string) => {
    if (!sb) return
    const ok = await moderateComment(sb, { commentId, status: 'published' })
    if (!ok) return
    setCommentsToModerate((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, status: 'published' } : c)),
    )
  }

  const addEditorialRole = async () => {
    if (!sb || !roleEmail.trim()) return
    const ok = await upsertEditorialUser(sb, roleEmail.trim(), roleValue)
    if (!ok) return
    setRoleEmail('')
    const roles = await fetchEditorialUsers(sb)
    setEditorialUsers(roles)
  }

  const createCampaign = async () => {
    if (!sb || !campaignTitle.trim() || !campaignSubject.trim()) return
    const ok = await createNewsletterCampaign(sb, {
      title: campaignTitle,
      subject: campaignSubject,
      contentMarkdown: campaignBody,
      createdBy: user?.email ?? undefined,
    })
    if (!ok) {
      setError(
        'Impossible de créer la campagne newsletter. Vérifie que ton email a les droits admin Supabase.',
      )
      return
    }
    setCampaignTitle('')
    setCampaignSubject('')
    setCampaignBody('')
    setError(null)
    const newsletter = await fetchNewsletterCampaigns(sb)
    setCampaigns(newsletter)
  }

  const setRefundStatus = async (id: string, status: RefundRequestRow['status']) => {
    if (!sb) return
    const ok = await updateRefundRequestStatus(sb, id, status)
    if (!ok) {
      setError('Impossible de mettre à jour le statut du remboursement.')
      return
    }
    setRefundRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    setError(null)
  }

  const editorialStatusBanner = (
    <div
      aria-live="polite"
      className={cn(
        'rounded-2xl border p-3 text-sm font-semibold',
        status === 'saving' && 'border-sky-300/80 bg-sky-50 text-sky-900',
        status === 'saved' && 'border-emerald-300/80 bg-emerald-50 text-emerald-900',
        status === 'error' && 'border-rose-300/80 bg-rose-50 text-rose-900',
        status === 'idle' && 'border-slate-200/80 bg-white text-slate-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200',
      )}
    >
      {status === 'saving' && 'Sauvegarde en cours...'}
      {status === 'saved' && 'Enregistré.'}
      {status === 'error' && 'Erreur de sauvegarde.'}
      {status === 'idle' && 'Crée un brouillon ou sélectionne un article pour éditer.'}
    </div>
  )

  const articleEditorPanel = (
    <Card className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700/80 dark:text-slate-300">Titre</label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    title: e.target.value,
                    slug: p.id ? p.slug : slugify(e.target.value),
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80 dark:text-slate-300">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80 dark:text-slate-300">Tag</label>
              <select
                value={form.tag}
                onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value as FormState['tag'] }))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="Breaking">Breaking</option>
                <option value="Analyse">Analyse</option>
                <option value="Rumeurs">Rumeurs</option>
                <option value="Débrief">Débrief</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700/80 dark:text-slate-300">
                Résumé court (chapo)
              </label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                placeholder="2–3 phrases sous le titre. Si vide, le 1er paragraphe du corps sera utilisé à l’affichage."
                className="mt-1 min-h-[70px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80 dark:text-slate-300">Auteur</label>
              <Input value={form.authorName} onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80 dark:text-slate-300">Image couverture (URL)</label>
              <Input value={form.coverImageUrl} onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))} className="mt-1" />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                  {uploadingCoverImage ? 'Import...' : 'Uploader la couverture'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      void handleCoverImageUpload(file)
                      e.currentTarget.value = ''
                    }}
                  />
                </label>
                {form.coverImageUrl.trim() ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl text-xs"
                    onClick={() => setForm((p) => ({ ...p, coverImageUrl: '' }))}
                  >
                    Retirer couverture
                  </Button>
                ) : null}
              </div>
              {form.coverImageUrl.trim() ? (
                <img
                  src={form.coverImageUrl}
                  alt="Couverture"
                  className="mt-2 h-24 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                  loading="lazy"
                />
              ) : null}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80 dark:text-slate-300">Ligues (CSV)</label>
              <Input value={form.leagueIds} onChange={(e) => setForm((p) => ({ ...p, leagueIds: e.target.value }))} className="mt-1" placeholder="ligue-1,epl" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80 dark:text-slate-300">Clubs (CSV)</label>
              <Input value={form.clubIds} onChange={(e) => setForm((p) => ({ ...p, clubIds: e.target.value }))} className="mt-1" placeholder="psg,om" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700/80 dark:text-slate-300">Contenu markdown</label>
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Mode simple: collage enrichi (Word / Google Docs)
                </p>
                <div
                  ref={richEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onPaste={handlePasteInRichEditor}
                  className="mt-2 min-h-[130px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" variant="soft" className="rounded-xl text-xs" onClick={pasteRichTextAsHtml}>
                    Utiliser ce texte (HTML propre)
                  </Button>
                  <Button type="button" variant="ghost" className="rounded-xl text-xs" onClick={clearRichEditor}>
                    Vider la zone
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {ARTICLE_TEMPLATES.map((tpl) => (
                  <Button
                    key={tpl.id}
                    type="button"
                    variant="ghost"
                    className="rounded-xl text-xs"
                    onClick={() => setForm((p) => ({ ...p, bodyMarkdown: tpl.markdown }))}
                  >
                    Modèle : {tpl.label}
                  </Button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="soft"
                  className="rounded-xl text-xs"
                  onClick={() => wrapMarkdownSelection('**', '**')}
                >
                  Gras
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl text-xs"
                  onClick={() => insertLayoutTemplate('\n\n## Nouvelle section\n\n')}
                >
                  + Section (H2)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl text-xs"
                  onClick={() => insertLayoutTemplate('\n\n### Sous-partie\n\n')}
                >
                  + Sous-partie (H3)
                </Button>
              </div>
              <textarea
                ref={markdownRef}
                value={form.bodyMarkdown}
                onChange={(e) => setForm((p) => ({ ...p, bodyMarkdown: e.target.value }))}
                className="mt-1 min-h-[320px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-[13px] leading-relaxed text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                aria-describedby="admin-markdown-help"
              />
              <p id="admin-markdown-help" className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Rédaction simple : `##` section (H2), `###` sous-partie (H3), paragraphes séparés par une ligne
                vide. Listes avec `-` ou `1.` en début de ligne (une puce par ligne). Liens et images
                `![légende](url)`.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                  {uploadingImage ? 'Import...' : 'Importer une image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      void handleImageUpload(file)
                      e.currentTarget.value = ''
                    }}
                  />
                </label>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  L’image est uploadée puis insérée automatiquement en markdown.
                </span>
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Images detectees dans le texte
                </p>
                {markdownImages.length === 0 ? (
                  <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Aucune image dans le markdown pour le moment.
                  </p>
                ) : (
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {markdownImages.map((img) => (
                      <div
                        key={`${img.index}-${img.url}`}
                        className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <img
                          src={img.url}
                          alt={img.alt || `Image ${img.index + 1}`}
                          className="h-20 w-full rounded-lg object-cover"
                          loading="lazy"
                        />
                        <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          {img.alt || `Image ${img.index + 1}`}
                        </p>
                        <p className="line-clamp-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">{img.url}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                            Remplacer
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null
                                void replaceMarkdownImageByIndex(img.index, file)
                                e.currentTarget.value = ''
                              }}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            className="rounded-lg px-2 py-1 text-[11px]"
                            onClick={() => removeMarkdownImageByIndex(img.index)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80 dark:text-slate-300">Planifier (date/heure)</label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80 dark:text-slate-300">Relecteur (optionnel)</label>
              <Input
                value={form.reviewedBy}
                onChange={(e) => setForm((p) => ({ ...p, reviewedBy: e.target.value }))}
                className="mt-1"
                placeholder="Nom de la relecture"
              />
            </div>
            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">Assistant SEO (FR)</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Score : {seoAudit.score}/100
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {seoAudit.tips.length === 0 ? (
                  <li className="text-xs font-semibold text-emerald-700">Très bien : article bien optimisé pour la découverte SEO.</li>
                ) : (
                  seoAudit.tips.map((tip) => (
                    <li key={tip} className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      - {tip}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" className="rounded-xl" disabled={!canSave} onClick={() => void saveNow()}>
              Enregistrer
            </Button>
            <Button variant="soft" className="rounded-xl" disabled={!form.id} onClick={() => void moveCurrentToReview()}>
              Envoyer en relecture
            </Button>
            <Button variant="soft" className="rounded-xl" disabled={!form.id || !form.scheduledAt} onClick={() => void scheduleCurrent()}>
              Planifier
            </Button>
            {selected?.status === 'published' ? (
              <Button variant="soft" className="rounded-xl" onClick={() => void unpublishCurrent()}>
                Dépublier
              </Button>
            ) : (
              <Button variant="soft" className="rounded-xl" disabled={!form.id} onClick={() => void publishCurrent()}>
                Publier
              </Button>
            )}
            <Button variant="ghost" className="rounded-xl" disabled={!form.id} onClick={() => void deleteCurrent()}>
              Supprimer
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => setPreviewOpen((v) => !v)}>
              {previewOpen ? 'Masquer aperçu' : 'Voir aperçu'}
            </Button>
          </div>

          {previewOpen ? (
            <Card className="space-y-3 border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <h3 className="font-display text-lg font-black text-tf-dark">Aperçu live</h3>
              <p className="text-sm font-semibold text-tf-grey dark:text-slate-300">
                {resolveArticleExcerpt({
                  excerpt: form.excerpt,
                  bodyMarkdown: form.bodyMarkdown,
                }) || 'Aucun résumé (remplis le chapo ou le corps).'}
              </p>
              <div
                data-tf-article-tone="light"
                className="tf-article-prose rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80"
              >
                <ArticleMarkdown
                  markdown={form.bodyMarkdown || '_Commence à écrire : une section `##`, puis des paragraphes._'}
                />
              </div>
            </Card>
          ) : null}
    </Card>
  )

  const articleListPanel = (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-black text-tf-dark">Articles</h2>
        <Button variant="primary" className="rounded-xl px-3 py-2 text-xs" onClick={() => void createNew()}>
          Nouveau
        </Button>
      </div>
      {loading ? <p className="text-sm font-semibold text-tf-grey">Chargement...</p> : null}
      <div className="space-y-2">
        {articles.map((a) => (
          <button
            key={a.id}
            type="button"
            className={cn(
              'w-full rounded-xl border p-2.5 text-left transition',
              selectedId === a.id
                ? 'border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/40'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500',
            )}
            onClick={() => {
              setSelectedId(a.id)
              setForm(formFromArticle(a))
              setStatus('idle')
            }}
          >
            <p className="line-clamp-1 text-sm font-black text-tf-dark">{a.title}</p>
            <p className="mt-0.5 text-xs font-semibold text-tf-grey">{statusLabel(a.status)}</p>
          </button>
        ))}
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      <header className="space-y-1 border-b border-tf-grey-pastel/50 pb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">Accès restreint</p>
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">Administration Talk Foot</h1>
        <p className="text-sm font-medium text-tf-grey">
          Connecté en tant que <strong className="text-tf-dark">{user?.email ?? user?.displayName}</strong>
        </p>
      </header>

      {error ? (
        <Card className="border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <AdminSectionNav active={activeSection} onChange={setActiveSection} badges={sectionBadges} />

        <div className="min-w-0 space-y-4">
          {activeSection === 'overview' ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Card className="p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Vues 7 jours</p>
                  <p className="mt-1 text-2xl font-black text-tf-dark">{dashboard?.views7d ?? 0}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Vues 30 jours</p>
                  <p className="mt-1 text-2xl font-black text-tf-dark">{dashboard?.views30d ?? 0}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Clics CTA 30 jours</p>
                  <p className="mt-1 text-2xl font-black text-tf-dark">{dashboard?.ctaClicks30d ?? 0}</p>
                </Card>
              </div>

              {(pendingRefundCount > 0 || moderationAlertCount > 0) && (
                <Card className="space-y-2 p-4">
                  <h2 className="font-display text-lg font-black text-tf-dark">À traiter</h2>
                  {pendingRefundCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setActiveSection('operations')}
                      className={cn(
                        TF_FOCUS_VISIBLE,
                        'flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-left dark:border-amber-900/50 dark:bg-amber-950/30',
                      )}
                    >
                      <span className="text-sm font-bold text-amber-950 dark:text-amber-100">
                        {pendingRefundCount} demande{pendingRefundCount > 1 ? 's' : ''} de remboursement
                      </span>
                      <span className="text-xs font-black text-amber-800 dark:text-amber-200">Voir →</span>
                    </button>
                  ) : null}
                  {moderationAlertCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setActiveSection('moderation')}
                      className={cn(
                        TF_FOCUS_VISIBLE,
                        'flex w-full items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-left dark:border-sky-900/50 dark:bg-sky-950/30',
                      )}
                    >
                      <span className="text-sm font-bold text-sky-950 dark:text-sky-100">
                        {moderationAlertCount} commentaire{moderationAlertCount > 1 ? 's' : ''} à modérer
                      </span>
                      <span className="text-xs font-black text-sky-800 dark:text-sky-200">Voir →</span>
                    </button>
                  ) : null}
                </Card>
              )}

              <Card className="p-4">
                <h2 className="font-display text-lg font-black text-tf-dark">Top articles (30 jours)</h2>
                <div className="mt-3 space-y-2">
                  {dashboard?.topArticles30d?.length ? (
                    dashboard.topArticles30d.map((a) => (
                      <div
                        key={a.articleId}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <p className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-100">{a.title}</p>
                        <span className="text-xs font-black text-slate-600 dark:text-slate-300">{a.views} vues</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Pas encore de données.</p>
                  )}
                </div>
              </Card>
            </>
          ) : null}

          {activeSection === 'editorial' ? (
            <>
              {editorialStatusBanner}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                {articleListPanel}
                {articleEditorPanel}
              </div>
            </>
          ) : null}

          {activeSection === 'moderation' ? (
            <Card className="p-4">
              <h2 className="font-display text-lg font-black text-tf-dark">Modération commentaires</h2>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Commentaires signalés ou en attente de validation.
              </p>
              <div className="mt-3 space-y-2">
                {commentsToModerate.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Aucun commentaire à modérer.</p>
                ) : (
                  commentsToModerate.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                          {c.authorName} · {c.reportedCount} signalement(s) · {c.status}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="ghost" className="rounded-lg px-2 py-1 text-xs" onClick={() => void publishComment(c.id)}>
                            Publier
                          </Button>
                          <Button variant="ghost" className="rounded-lg px-2 py-1 text-xs" onClick={() => void hideComment(c.id)}>
                            Masquer
                          </Button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{c.body}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ) : null}

          {activeSection === 'operations' ? (
            <div className="space-y-4">
              <Card className="p-4">
                <h2 className="font-display text-lg font-black text-tf-dark">Demandes de remboursement</h2>
                <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  1. Ouvre le paiement dans Stripe et effectue le remboursement. 2. Préviens l’utilisateur par e-mail. 3. Mets à jour le statut ci-dessous.
                </p>
                <div className="mt-3 space-y-2">
                  {refundRequests.length === 0 ? (
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Aucune demande pour le moment.</p>
                  ) : (
                    refundRequests.map((r) => {
                      const stripeUrl = stripeDashboardUrl(r.paymentRef)
                      return (
                        <div
                          key={r.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                              {r.purchaseKind === 'subscription' ? 'Abonnement' : 'Pack médailles'}
                            </p>
                            <span
                              className={cn(
                                'rounded-md px-2 py-0.5 text-[10px] font-black uppercase',
                                r.status === 'resolved' && 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100',
                                r.status === 'rejected' && 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-100',
                                (r.status === 'pending' || r.status === 'in_progress') &&
                                  'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100',
                              )}
                            >
                              {refundStatusLabel(r.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {r.userEmail ?? 'E-mail non fourni'}
                            {r.userId ? ` · ${r.userId.slice(0, 12)}…` : ''}
                          </p>
                          {r.paymentRef ? (
                            <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">
                              Stripe : {r.paymentRef}
                              {stripeUrl ? (
                                <>
                                  {' · '}
                                  <a
                                    href={stripeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-sky-700 underline dark:text-sky-300"
                                  >
                                    Ouvrir dans Stripe
                                  </a>
                                </>
                              ) : null}
                            </p>
                          ) : null}
                          <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{r.reason}</p>
                          <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {new Date(r.createdAt).toLocaleString('fr-FR')}
                          </p>
                          {r.status !== 'resolved' && r.status !== 'rejected' ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {r.status === 'pending' ? (
                                <Button
                                  variant="soft"
                                  className="rounded-lg px-2 py-1 text-xs"
                                  onClick={() => void setRefundStatus(r.id, 'in_progress')}
                                >
                                  Marquer en cours
                                </Button>
                              ) : null}
                              <Button
                                variant="soft"
                                className="rounded-lg px-2 py-1 text-xs"
                                onClick={() => void setRefundStatus(r.id, 'resolved')}
                              >
                                Résolu
                              </Button>
                              <Button
                                variant="ghost"
                                className="rounded-lg px-2 py-1 text-xs"
                                onClick={() => void setRefundStatus(r.id, 'rejected')}
                              >
                                Refuser
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      )
                    })
                  )}
                </div>
              </Card>

              <Card className="border-dashed p-4">
                <h2 className="font-display text-lg font-black text-tf-dark">Gestion utilisateurs</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Recherche de comptes, abonnements et sanctions — section prévue pour les prochaines versions.
                </p>
              </Card>
            </div>
          ) : null}

          {activeSection === 'team' ? (
            <Card className="p-4">
              <h2 className="font-display text-lg font-black text-tf-dark">Rôles éditoriaux</h2>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Accès rédaction, relecture et publication des articles.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                <Input value={roleEmail} onChange={(e) => setRoleEmail(e.target.value)} placeholder="email@exemple.com" />
                <select
                  value={roleValue}
                  onChange={(e) => setRoleValue(e.target.value as EditorialRole)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="redacteur">Rédacteur</option>
                  <option value="relecteur">Relecteur</option>
                  <option value="admin">Admin éditorial</option>
                </select>
                <Button variant="soft" className="rounded-xl" onClick={() => void addEditorialRole()}>
                  Ajouter
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {editorialUsers.map((u) => (
                  <div
                    key={u.email}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{u.email}</span>
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300">{u.role}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {activeSection === 'newsletter' ? (
            <Card className="p-4">
              <h2 className="font-display text-lg font-black text-tf-dark">Newsletter</h2>
              <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Une <strong>campagne</strong> = un email groupé envoyé aux abonnés newsletter. Cette zone sert aux emails
                marketing/infos, pas à publier un article.
              </p>
              <div className="mt-3 space-y-2">
                <Input
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="Nom interne de la campagne (ex: Coupe du monde 2026)"
                />
                <Input value={campaignSubject} onChange={(e) => setCampaignSubject(e.target.value)} placeholder="Objet email" />
                <textarea
                  value={campaignBody}
                  onChange={(e) => setCampaignBody(e.target.value)}
                  className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Message email (markdown)"
                />
                <Button variant="soft" className="rounded-xl" onClick={() => void createCampaign()}>
                  Créer le brouillon d&apos;email
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {campaigns.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Aucune campagne créée.</p>
                ) : (
                  campaigns.map((c) => (
                    <div key={c.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">{c.title}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">Statut: {c.status}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <Link
        to="/profile"
        className={cn(
          TF_FOCUS_VISIBLE,
          'inline-flex min-h-tf-touch items-center justify-center rounded-xl border border-tf-dark bg-white/95 px-5 py-3 text-sm font-semibold font-display text-tf-dark shadow-tf-elev-1 transition hover:bg-tf-electric-soft dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
        )}
      >
        Retour au profil
      </Link>
    </div>
  )
}
