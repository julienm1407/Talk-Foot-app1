import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { logSiteActivity } from '../../lib/activityLog'
import { isSupabaseConfigured } from '../../lib/supabase/isEnabled'

export function ActivityRouteLogger() {
  const location = useLocation()
  const prev = useRef<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const path = location.pathname + location.search
    if (prev.current === path) return
    prev.current = path
    void logSiteActivity('navigation', { path, metadata: { search: location.search || undefined } })
  }, [location.pathname, location.search])

  return null
}
