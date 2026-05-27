import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { ArticleMarkdown } from '../components/article/ArticleMarkdown'
import { useAuth } from '../contexts/AuthContext'
import {
  createDraftArticle,
  deleteDraftArticle,
  listAdminArticles,
  publishArticle,
  unpublishArticle,
  updateDraftArticle,
  type AdminArticle,
  type AdminArticleDraftInput,
} from '../lib/supabase/articles'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { cn } from '../utils/cn'
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

  const sb = useMemo(() => getSupabaseBrowserClient(), [])

  const selected = useMemo(
    () => articles.find((a) => a.id === selectedId) ?? null,
    [articles, selectedId],
  )

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
      excerpt: 'Résumé court de l’article.',
      bodyMarkdown: '## Introduction\n\nCommence à rédiger ici.',
      authorName: user?.displayName || user?.email || 'Talk Foot',
    }
    const created = await createDraftArticle(sb, draftInputFromForm(next))
    if (!created) {
      setError('Impossible de créer le brouillon.')
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

  return (
    <div className="space-y-6">
      <header className="space-y-1 border-b border-tf-grey-pastel/50 pb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">Accès restreint</p>
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">Éditeur d’articles</h1>
        <p className="text-sm font-medium text-tf-grey">
          Connecté en tant que <strong className="text-tf-dark">{user?.email ?? user?.displayName}</strong>
        </p>
      </header>

      <div
        aria-live="polite"
        className={cn(
          'rounded-2xl border p-3 text-sm font-semibold',
          status === 'saving' && 'border-sky-300/80 bg-sky-50 text-sky-900',
          status === 'saved' && 'border-emerald-300/80 bg-emerald-50 text-emerald-900',
          status === 'error' && 'border-rose-300/80 bg-rose-50 text-rose-900',
          status === 'idle' && 'border-slate-200/80 bg-white text-slate-700',
        )}
      >
        {status === 'saving' && 'Sauvegarde en cours...'}
        {status === 'saved' && 'Enregistré.'}
        {status === 'error' && 'Erreur de sauvegarde.'}
        {status === 'idle' && 'Crée un brouillon ou sélectionne un article pour éditer.'}
      </div>

      {error ? (
        <Card className="border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900">{error}</Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
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
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
                onClick={() => {
                  setSelectedId(a.id)
                  setForm(formFromArticle(a))
                  setStatus('idle')
                }}
              >
                <p className="line-clamp-1 text-sm font-black text-tf-dark">{a.title}</p>
                <p className="mt-0.5 text-xs font-semibold text-tf-grey">{a.status === 'published' ? 'Publié' : 'Brouillon'}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700/80">Titre</label>
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
              <label className="text-xs font-bold text-slate-700/80">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80">Tag</label>
              <select
                value={form.tag}
                onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value as FormState['tag'] }))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"
              >
                <option value="Breaking">Breaking</option>
                <option value="Analyse">Analyse</option>
                <option value="Rumeurs">Rumeurs</option>
                <option value="Débrief">Débrief</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700/80">Extrait</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                className="mt-1 min-h-[70px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80">Auteur</label>
              <Input value={form.authorName} onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80">Image couverture (URL)</label>
              <Input value={form.coverImageUrl} onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80">Ligues (CSV)</label>
              <Input value={form.leagueIds} onChange={(e) => setForm((p) => ({ ...p, leagueIds: e.target.value }))} className="mt-1" placeholder="ligue-1,epl" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700/80">Clubs (CSV)</label>
              <Input value={form.clubIds} onChange={(e) => setForm((p) => ({ ...p, clubIds: e.target.value }))} className="mt-1" placeholder="psg,om" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700/80">Contenu markdown</label>
              <textarea
                value={form.bodyMarkdown}
                onChange={(e) => setForm((p) => ({ ...p, bodyMarkdown: e.target.value }))}
                className="mt-1 min-h-[320px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-[13px] leading-relaxed text-slate-900"
                aria-describedby="admin-markdown-help"
              />
              <p id="admin-markdown-help" className="mt-1 text-xs font-semibold text-slate-500">
                Supporte titres, listes, tableaux markdown et images URL.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" className="rounded-xl" disabled={!canSave} onClick={() => void saveNow()}>
              Enregistrer
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
            <Card className="space-y-3 border-slate-200 bg-slate-50/70 p-4">
              <h3 className="font-display text-lg font-black text-tf-dark">Aperçu live</h3>
              <p className="text-sm font-semibold text-tf-grey">{form.excerpt || 'Aucun extrait.'}</p>
              <ArticleMarkdown
                markdown={form.bodyMarkdown || '_Commence à écrire du markdown..._'}
                className="prose prose-slate max-w-none prose-headings:font-display prose-headings:font-black prose-table:block prose-table:w-full"
              />
            </Card>
          ) : null}
        </Card>
      </div>

      <Link
        to="/profile"
        className={cn(
          TF_FOCUS_VISIBLE,
          'inline-flex min-h-tf-touch items-center justify-center rounded-xl border border-tf-dark bg-white/95 px-5 py-3 text-sm font-semibold font-display text-tf-dark shadow-tf-elev-1 transition hover:bg-tf-electric-soft',
        )}
      >
        Retour au profil
      </Link>
    </div>
  )
}
