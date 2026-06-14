import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

const CHUNK_RELOAD_AT_KEY = 'tf-chunk-reload-at-v1'
/** Une seule tentative de reload par fenêtre — évite boucle infinie si le chunk échoue toujours (Safari). */
const RELOAD_COOLDOWN_MS = 45_000

function isChunkLoadError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('importing a module script failed') ||
    msg.includes('dynamically imported module')
  )
}

/** Efface le flag après chargement réussi d’un chunk lazy. */
export function clearChunkReloadFlag(): void {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_AT_KEY)
  } catch {
    /* ignore */
  }
}

function canReloadForChunkError(): boolean {
  try {
    const raw = sessionStorage.getItem(CHUNK_RELOAD_AT_KEY)
    if (!raw) return true
    const at = Number(raw)
    if (!Number.isFinite(at)) return true
    return Date.now() - at >= RELOAD_COOLDOWN_MS
  } catch {
    return true
  }
}

function markChunkReloadAttempt(): void {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_AT_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

/**
 * `React.lazy` avec rechargement automatique si le chunk a changé après un déploiement
 * (index.html en cache → hash .js introuvable → 404).
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await importer()
      clearChunkReloadFlag()
      return mod
    } catch (err) {
      if (isChunkLoadError(err) && canReloadForChunkError()) {
        markChunkReloadAttempt()
        window.location.reload()
        return new Promise(() => {})
      }
      throw err
    }
  })
}
