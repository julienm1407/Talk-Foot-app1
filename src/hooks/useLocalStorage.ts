import { useEffect, useState } from 'react'

/**
 * Si le JSON ne correspond pas au type attendu (ex. objet au lieu d’un tableau),
 * on repart sur `initial` pour éviter des crashs au rendu ([...x], .filter, .includes…).
 */
export function useLocalStorageState<T>(
  key: string,
  initial: T,
  guard?: (parsed: unknown) => boolean,
) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return initial
      const parsed: unknown = JSON.parse(raw)
      if (guard && !guard(parsed)) return initial
      return parsed as T
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [key, state])

  return [state, setState] as const
}

