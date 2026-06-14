import { useEffect, useRef } from 'react'
import { useAuth as useClerkAuth, useSession } from '@clerk/clerk-react'
import { isClerkAuthConfigured } from '../../contexts/AuthContext'
import { getSupabaseBrowserClient } from '../../lib/supabase/client'
import { isSupabaseConfigured } from '../../lib/supabase/isEnabled'

/** Objectif produit : rester connecté ≥ 4 h tant que l’onglet reste ouvert. */
const CLERK_TOUCH_MS = 5 * 60 * 1000
const CLERK_TOKEN_REFRESH_MS = 10 * 60 * 1000
const SUPABASE_REFRESH_MS = 45 * 60 * 1000

async function refreshSupabaseSessionIfPresent(): Promise<void> {
  if (!isSupabaseConfigured()) return
  const sb = getSupabaseBrowserClient()
  if (!sb) return

  const { data: sessionWrap } = await sb.auth.getSession()
  if (!sessionWrap.session) return

  await sb.auth.refreshSession()
}

function ClerkSessionKeepAlive() {
  const { session } = useSession()
  const { isSignedIn } = useClerkAuth()
  const lastTouchRef = useRef(0)
  const lastTokenRef = useRef(0)
  const lastSupabaseRefreshRef = useRef(0)

  useEffect(() => {
    if (!isSignedIn || !session) return

    const runKeepAlive = async (force = false) => {
      if (document.visibilityState !== 'visible') return

      const now = Date.now()
      try {
        if (force || now - lastTouchRef.current >= CLERK_TOUCH_MS) {
          await session.touch()
          lastTouchRef.current = now
        }
        if (force || now - lastTokenRef.current >= CLERK_TOKEN_REFRESH_MS) {
          await session.getToken()
          lastTokenRef.current = now
        }
        if (force || now - lastSupabaseRefreshRef.current >= SUPABASE_REFRESH_MS) {
          await refreshSupabaseSessionIfPresent()
          lastSupabaseRefreshRef.current = now
        }
      } catch {
        /* Le SDK Clerk gère l’expiration ; on ignore les erreurs transitoires réseau. */
      }
    }

    void runKeepAlive(true)

    const interval = window.setInterval(() => void runKeepAlive(), 60_000)
    const onVisible = () => void runKeepAlive(true)
    const onActivity = () => {
      if (Date.now() - lastTouchRef.current >= CLERK_TOUCH_MS) void runKeepAlive()
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pointerdown', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity, { passive: true })

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  }, [isSignedIn, session])

  return null
}

function SupabaseAuthSessionKeepAlive() {
  const lastRefreshRef = useRef(0)

  useEffect(() => {
    if (!isSupabaseConfigured() || isClerkAuthConfigured()) return

    const refresh = async (force = false) => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (!force && now - lastRefreshRef.current < SUPABASE_REFRESH_MS) return
      try {
        await refreshSupabaseSessionIfPresent()
        lastRefreshRef.current = Date.now()
      } catch {
        /* ignore */
      }
    }

    void refresh(true)
    const interval = window.setInterval(() => void refresh(), 60_000)
    const onVisible = () => void refresh(true)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return null
}

/** Maintient Clerk + Supabase actifs tant que l’onglet reste ouvert (cible ≥ 4 h). */
export function SessionKeepAlive() {
  return (
    <>
      {isClerkAuthConfigured() ? <ClerkSessionKeepAlive /> : null}
      <SupabaseAuthSessionKeepAlive />
    </>
  )
}
