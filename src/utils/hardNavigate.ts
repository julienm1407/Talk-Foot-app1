/** Navigation pleine page — contourne les bugs tactiles / React Router sur mobile réel (profil). */
export function hardNavigateTo(path: string): void {
  const target = path.startsWith('/') ? path : `/${path}`
  const base = import.meta.env.BASE_URL ?? '/'
  const prefix = base === '/' || base === '' ? '' : base.replace(/\/$/, '')
  window.location.assign(`${prefix}${target}`)
}
