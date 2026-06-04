import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

const CHUNK_RELOAD_KEY = 'tf-chunk-reload-v1'

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

/** Efface le flag après chargement réussi (évite boucle de reload). */
export function clearChunkReloadFlag(): void {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
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
      if (isChunkLoadError(err)) {
        let alreadyReloaded = false
        try {
          alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1'
        } catch {
          /* ignore */
        }
        if (!alreadyReloaded) {
          try {
            sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
          } catch {
            /* ignore */
          }
          window.location.reload()
          return new Promise(() => {})
        }
      }
      throw err
    }
  })
}
