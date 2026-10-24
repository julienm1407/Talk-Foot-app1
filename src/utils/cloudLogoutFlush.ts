/** Évite un import circulaire Auth ↔ CloudUserState. */

let flush: (() => Promise<unknown>) | null = null

export function setCloudLogoutFlush(fn: (() => Promise<unknown>) | null): void {
  flush = fn
}

/** Pousse wallet / médailles vers le cloud avant signOut. */
export async function flushCloudBeforeLogout(): Promise<void> {
  if (!flush) return
  try {
    await Promise.race([
      flush(),
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 8000)
      }),
    ])
  } catch {
    /* on déconnecte quand même */
  }
}
