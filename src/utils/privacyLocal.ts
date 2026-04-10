import {
  TALKFOOT_STORAGE_PREFIX,
  CONSENT_STORAGE_KEY,
  CONSENT_POLICY_VERSION,
} from '../constants/privacyStorage'

function collectRawLocal(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(TALKFOOT_STORAGE_PREFIX)) continue
      const raw = localStorage.getItem(k)
      if (raw == null) continue
      try {
        out[k] = JSON.parse(raw) as unknown
      } catch {
        out[k] = raw
      }
    }
  } catch {
    /* private mode */
  }
  return out
}

/** Export JSON lisible — secrets d’auth (hash) omis du registre email. */
export function exportPersonalDataJson(): string {
  const data = collectRawLocal()
  const registryKey = 'talkfoot.auth.registry.v1'
  if (data[registryKey] && typeof data[registryKey] === 'object' && data[registryKey] !== null) {
    const reg = data[registryKey] as Record<string, unknown>
    const sanitized: Record<string, { id?: unknown; displayName?: unknown }> = {}
    for (const [email, v] of Object.entries(reg)) {
      if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>
        sanitized[email] = { id: o.id, displayName: o.displayName }
      }
    }
    data[registryKey] = {
      _note: 'Secrets (empreinte mot de passe) non inclus dans l’export pour sécurité.',
      comptes: sanitized,
    }
  }
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: 'Talk Foot',
      locale: 'navigateur (localStorage)',
      data,
    },
    null,
    2,
  )
}

export function downloadPersonalDataExport() {
  const blob = new Blob([exportPersonalDataJson()], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `talk-foot-donnees-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Supprime toutes les entrées Talk Foot du stockage local (session + local). */
export function purgeAllTalkFootBrowserStorage(): void {
  try {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(TALKFOOT_STORAGE_PREFIX)) toRemove.push(k)
    }
    for (const k of toRemove) localStorage.removeItem(k)
  } catch {
    /* ignore */
  }
  try {
    const toRemoveS: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k?.startsWith(TALKFOOT_STORAGE_PREFIX)) toRemoveS.push(k)
    }
    for (const k of toRemoveS) sessionStorage.removeItem(k)
  } catch {
    /* ignore */
  }
}

export function hasRecordedConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return false
    const o = JSON.parse(raw) as { v?: number }
    return o.v === CONSENT_POLICY_VERSION
  } catch {
    return false
  }
}

export function recordEssentialConsent(): void {
  try {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        v: CONSENT_POLICY_VERSION,
        decidedAt: new Date().toISOString(),
        essentialLocal: true,
      }),
    )
  } catch {
    /* private mode */
  }
}
