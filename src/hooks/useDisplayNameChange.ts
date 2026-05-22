import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import {
  changeDisplayNameCloud,
  fetchDisplayNameStatus,
  type ChangeDisplayNameResult,
  type DisplayNameStatus,
} from '../lib/supabase/displayName'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  formatDisplayNameCooldown,
  sanitizeDisplayNameInput,
  suggestAlternateDisplayNames,
  validateDisplayNameFormat,
} from '../utils/displayNameRules'
import { containsBannedWord, MODERATION_REFUSED_MESSAGE_FR } from '../utils/bannedWords'

const LOCAL_META_KEY = 'talkfoot.displayNameMeta.v1'

type LocalMeta = {
  changeCount: number
  periodStartMs: number
}

function loadRegistry(): Record<string, { id: string; displayName: string }> {
  try {
    const raw = localStorage.getItem('talkfoot.auth.registry.v1')
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, { id: string; displayName: string }>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadLocalMeta(userId: string): LocalMeta {
  try {
    const raw = localStorage.getItem(LOCAL_META_KEY)
    const all = raw ? (JSON.parse(raw) as Record<string, LocalMeta>) : {}
    return all[userId] ?? { changeCount: 0, periodStartMs: Date.now() }
  } catch {
    return { changeCount: 0, periodStartMs: Date.now() }
  }
}

function saveLocalMeta(userId: string, meta: LocalMeta) {
  try {
    const raw = localStorage.getItem(LOCAL_META_KEY)
    const all = raw ? (JSON.parse(raw) as Record<string, LocalMeta>) : {}
    all[userId] = meta
    localStorage.setItem(LOCAL_META_KEY, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}

function localStatus(userId: string, displayName: string): DisplayNameStatus {
  const meta = loadLocalMeta(userId)
  const now = Date.now()
  const windowMs = 14 * 24 * 60 * 60 * 1000
  let count = meta.changeCount
  let next: string | null = null
  if (count >= 2 && now >= meta.periodStartMs + windowMs) {
    count = 0
  } else if (count >= 2) {
    next = new Date(meta.periodStartMs + windowMs).toISOString()
  }
  return {
    displayName,
    changesUsed: count,
    changesRemaining: Math.max(0, 2 - count),
    nextAllowedAt: next,
    canChange: count < 2 || next === null,
  }
}

function isNameTakenLocal(name: string, userId: string): boolean {
  const norm = sanitizeDisplayNameInput(name).toLowerCase()
  const registry = loadRegistry()
  for (const reg of Object.values(registry)) {
    if (reg.id === userId) continue
    if (reg.displayName.trim().toLowerCase() === norm) return true
  }
  return false
}

export function useDisplayNameChange() {
  const { user, updateProfile, refreshAuthUser } = useAuth()
  const [status, setStatus] = useState<DisplayNameStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshStatus = useCallback(async () => {
    if (!user?.id) {
      setStatus(null)
      return
    }
    if (isSupabaseConfigured()) {
      const sb = getSupabaseBrowserClient()
      if (!sb) return
      const cloud = await fetchDisplayNameStatus(sb, user.id)
      if (cloud) {
        setStatus(cloud)
        return
      }
    }
    setStatus(localStatus(user.id, user.displayName))
  }, [user?.id, user?.displayName])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const applyChange = useCallback(
    async (rawName: string): Promise<ChangeDisplayNameResult> => {
      if (!user?.id) {
        return {
          ok: false,
          error: 'unavailable',
          message: 'Connecte-toi pour modifier ton pseudo.',
        }
      }
      const name = sanitizeDisplayNameInput(rawName)
      const formatErr = validateDisplayNameFormat(name)
      if (formatErr) {
        return { ok: false, error: 'invalid_format', message: formatErr }
      }
      if (containsBannedWord(name)) {
        return { ok: false, error: 'banned', message: MODERATION_REFUSED_MESSAGE_FR }
      }

      if (isSupabaseConfigured()) {
        const sb = getSupabaseBrowserClient()
        if (!sb) {
          return {
            ok: false,
            error: 'unavailable',
            message: 'Service indisponible.',
          }
        }
        setLoading(true)
        const result = await changeDisplayNameCloud(sb, user.id, name)
        setLoading(false)
        if (result.ok) {
          updateProfile(result.displayName)
          await refreshAuthUser()
          await refreshStatus()
        }
        return result
      }

      const st = localStatus(user.id, user.displayName)
      if (!st.canChange && st.nextAllowedAt) {
        const when = formatDisplayNameCooldown(st.nextAllowedAt)
        return {
          ok: false,
          error: 'cooldown',
          message: `Limite atteinte (2 changements). Réessaie ${when ?? 'plus tard'}.`,
          nextAllowedAt: st.nextAllowedAt,
          changesUsed: st.changesUsed,
        }
      }

      const normCurrent = user.displayName.trim().toLowerCase()
      if (name.toLowerCase() === normCurrent) {
        return {
          ok: true,
          displayName: user.displayName,
          changesRemaining: st.changesRemaining,
          nextAllowedAt: st.nextAllowedAt,
        }
      }

      if (isNameTakenLocal(name, user.id)) {
        return {
          ok: false,
          error: 'taken',
          message: 'Ce pseudo est déjà pris sur cet appareil. Choisis une variante :',
          suggestions: suggestAlternateDisplayNames(name),
        }
      }

      let meta = loadLocalMeta(user.id)
      const now = Date.now()
      const windowMs = 14 * 24 * 60 * 60 * 1000
      if (meta.changeCount >= 2 && now >= meta.periodStartMs + windowMs) {
        meta = { changeCount: 0, periodStartMs: now }
      }
      if (meta.changeCount >= 2) {
        return {
          ok: false,
          error: 'cooldown',
          message: 'Tu as déjà changé de pseudo 2 fois. Attends 14 jours.',
          nextAllowedAt: new Date(meta.periodStartMs + windowMs).toISOString(),
          changesUsed: meta.changeCount,
        }
      }

      updateProfile(name)
      saveLocalMeta(user.id, {
        changeCount: meta.changeCount + 1,
        periodStartMs: meta.periodStartMs || now,
      })
      const nextSt = localStatus(user.id, name)
      setStatus(nextSt)
      return {
        ok: true,
        displayName: name,
        changesRemaining: nextSt.changesRemaining,
        nextAllowedAt: nextSt.nextAllowedAt,
      }
    },
    [user, updateProfile, refreshAuthUser, refreshStatus],
  )

  return {
    status,
    loading,
    refreshStatus,
    applyChange,
    cooldownLabel: formatDisplayNameCooldown(status?.nextAllowedAt),
  }
}
