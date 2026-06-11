/**
 * Applique les templates email Talk Foot (FR + branding) sur Supabase Auth et Clerk.
 *
 * Prérequis :
 *   SUPABASE_ACCESS_TOKEN — https://supabase.com/dashboard/account/tokens
 *   SUPABASE_PROJECT_REF   — ex. abcdefghijklm (ou extrait de VITE_SUPABASE_URL)
 *   CLERK_SECRET_KEY       — pour les emails Clerk (inscription en prod)
 *
 * Usage : node scripts/apply-auth-email-templates.mjs
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CLERK_AUTH_EMAIL_SLUGS,
  clerkAuthEmailTemplate,
  TALKFOOT_SITE_URL,
} from './auth-email/talkfootAuthEmail.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, '..', 'supabase', 'templates')

function readSupabaseTemplate(filename) {
  return readFileSync(join(TEMPLATES_DIR, filename), 'utf8')
}

function supabaseAuthEmailTemplates() {
  return {
    mailer_subjects_confirmation: 'Talk Foot — Confirme ton inscription ⚽',
    mailer_templates_confirmation_content: readSupabaseTemplate('confirm-signup.html'),
    mailer_subjects_recovery: 'Talk Foot — Réinitialise ton mot de passe',
    mailer_templates_recovery_content: readSupabaseTemplate('reset-password.html'),
  }
}

function projectRefFromEnv() {
  const explicit = process.env.SUPABASE_PROJECT_REF?.trim()
  if (explicit) return explicit
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/i)
  return match?.[1] ?? ''
}

async function applySupabaseTemplates() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
  const ref = projectRefFromEnv()
  if (!token || !ref) {
    console.log('[supabase] ignoré — SUPABASE_ACCESS_TOKEN ou SUPABASE_PROJECT_REF manquant')
    return { ok: false, skipped: true }
  }

  const payload = supabaseAuthEmailTemplates()
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('[supabase] échec', res.status, detail.slice(0, 400))
    return { ok: false, error: detail }
  }

  console.log('[supabase] templates confirmation / recovery / magic link / invite mis à jour')
  return { ok: true }
}

async function listClerkEmailTemplates(secret) {
  const res = await fetch('https://api.clerk.com/v1/templates/email', {
    headers: { Authorization: `Bearer ${secret}` },
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`list templates ${res.status}: ${detail.slice(0, 200)}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : data?.data ?? []
}

async function applyClerkTemplate(secret, slug, templatePayload) {
  const res = await fetch(`https://api.clerk.com/v1/templates/email/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(templatePayload),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return { ok: false, slug, error: detail.slice(0, 300) }
  }
  return { ok: true, slug }
}

async function applyClerkTemplates() {
  const secret = process.env.CLERK_SECRET_KEY?.trim()
  if (!secret) {
    console.log('[clerk] ignoré — CLERK_SECRET_KEY manquant')
    return { ok: false, skipped: true }
  }

  let templates = []
  try {
    templates = await listClerkEmailTemplates(secret)
  } catch (err) {
    console.error('[clerk] impossible de lister les templates:', err instanceof Error ? err.message : err)
    return { ok: false }
  }

  const slugsOnInstance = new Set(templates.map((t) => t.slug))
  const targets = CLERK_AUTH_EMAIL_SLUGS.filter((slug) => slugsOnInstance.has(slug))

  if (!targets.length) {
    console.log('[clerk] aucun slug connu trouvé. Slugs disponibles:', [...slugsOnInstance].join(', ') || '(vide)')
    return { ok: false }
  }

  let okCount = 0
  for (const slug of targets) {
    const payload = clerkAuthEmailTemplate(slug)
    if (!payload) continue
    const result = await applyClerkTemplate(secret, slug, payload)
    if (result.ok) {
      okCount += 1
      console.log(`[clerk] template "${slug}" mis à jour`)
    } else {
      console.warn(`[clerk] template "${slug}" échec:`, result.error)
    }
  }

  if (okCount === 0) return { ok: false }
  console.log(`[clerk] ${okCount} template(s) Talk Foot appliqué(s)`)
  console.log('[clerk] pense à uploader le logo dans Clerk → Settings → Branding (utilisé aussi par {{app.logo_image_url}})')
  return { ok: true }
}

async function main() {
  console.log(`Talk Foot — application des templates email auth (${TALKFOOT_SITE_URL})`)
  const supabase = await applySupabaseTemplates()
  const clerk = await applyClerkTemplates()

  if (supabase.skipped && clerk.skipped) {
    console.error('\nAucun provider configuré. Ajoute SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF et/ou CLERK_SECRET_KEY.')
    process.exitCode = 1
    return
  }

  if (!supabase.ok && !supabase.skipped && !clerk.ok && !clerk.skipped) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
