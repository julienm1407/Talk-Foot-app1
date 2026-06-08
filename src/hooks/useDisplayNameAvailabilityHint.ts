import { useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { checkDisplayNameAvailabilityCloud } from '../lib/supabase/displayName'
import { sanitizeDisplayNameInput, validateDisplayNameFormat } from '../utils/displayNameRules'

export type DisplayNameAvailabilityHint = {
  status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'
  message: string | null
  suggestions: string[]
}

export function useDisplayNameAvailabilityHint(
  rawName: string,
  options?: { excludeActorKey?: string | null; enabled?: boolean; debounceMs?: number },
): DisplayNameAvailabilityHint {
  const enabled = options?.enabled ?? true
  const debounceMs = options?.debounceMs ?? 500
  const excludeActorKey = options?.excludeActorKey
  const [hint, setHint] = useState<DisplayNameAvailabilityHint>({
    status: 'idle',
    message: null,
    suggestions: [],
  })
  const reqIdRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setHint({ status: 'idle', message: null, suggestions: [] })
      return
    }

    const name = sanitizeDisplayNameInput(rawName)
    if (name.length < 2) {
      setHint({ status: 'idle', message: null, suggestions: [] })
      return
    }

    const formatErr = validateDisplayNameFormat(name)
    if (formatErr) {
      setHint({ status: 'invalid', message: formatErr, suggestions: [] })
      return
    }

    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setHint({ status: 'idle', message: null, suggestions: [] })
      return
    }

    setHint({ status: 'checking', message: 'Vérification du pseudo…', suggestions: [] })
    const reqId = ++reqIdRef.current
    const timer = window.setTimeout(() => {
      void (async () => {
        const availability = await checkDisplayNameAvailabilityCloud(sb, name, excludeActorKey)
        if (reqId !== reqIdRef.current) return
        if (availability.available) {
          setHint({
            status: 'available',
            message: 'Ce pseudo est disponible.',
            suggestions: [],
          })
          return
        }
        if (availability.error === 'taken') {
          setHint({
            status: 'taken',
            message: availability.message,
            suggestions: availability.suggestions ?? [],
          })
          return
        }
        setHint({
          status:
            availability.error === 'invalid_format' || availability.error === 'invalid_length'
              ? 'invalid'
              : 'error',
          message: availability.message,
          suggestions: availability.suggestions ?? [],
        })
      })()
    }, debounceMs)

    return () => window.clearTimeout(timer)
  }, [rawName, excludeActorKey, enabled, debounceMs])

  return hint
}
