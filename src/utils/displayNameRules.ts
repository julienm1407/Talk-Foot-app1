const PSEUDO_RE = /^[\p{L}\p{N}_\s'-]{2,24}$/u

export function sanitizeDisplayNameInput(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 24)
}

/** Même logique que `normalize_display_name` côté Supabase. */
export function normalizeDisplayNameLookup(raw: string): string {
  return sanitizeDisplayNameInput(raw).toLowerCase()
}

export function validateDisplayNameFormat(name: string): string | null {
  const n = sanitizeDisplayNameInput(name)
  if (n.length < 2) return 'Le pseudo doit faire au moins 2 caractères.'
  if (n.length > 24) return 'Le pseudo ne peut pas dépasser 24 caractères.'
  if (!PSEUDO_RE.test(n)) {
    return 'Lettres, chiffres, espaces, tirets et underscores uniquement.'
  }
  return null
}

/** Suggestions si le pseudo est déjà pris. */
export function suggestAlternateDisplayNames(base: string, count = 5): string[] {
  const root = sanitizeDisplayNameInput(base).replace(/\s+/g, '_').slice(0, 18) || 'Supporter'
  const out: string[] = []
  const seen = new Set<string>()

  const add = (s: string) => {
    const v = sanitizeDisplayNameInput(s)
    if (v.length < 2 || v.length > 24) return
    const key = v.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(v)
  }

  const n2 = Math.floor(10 + Math.random() * 89)
  const n3 = Math.floor(100 + Math.random() * 900)
  const n4 = Math.floor(1000 + Math.random() * 9000)
  const yy = String(new Date().getFullYear()).slice(-2)

  add(`${root}${n2}`)
  add(`${root}_${n3}`)
  add(`${root}${yy}`)
  add(`${root}_TF`)
  add(`${root}${n4}`)

  let i = 0
  while (out.length < count && i < 12) {
    add(`${root}${Math.floor(Math.random() * 99)}`)
    i += 1
  }

  return out.slice(0, count)
}

export function formatDisplayNameCooldown(iso: string | null | undefined): string | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return null
  const diff = t - Date.now()
  if (diff <= 0) return null
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
  if (days <= 1) return 'demain'
  return `dans ${days} jours`
}
