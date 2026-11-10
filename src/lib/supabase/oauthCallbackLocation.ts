export function hasAuthCallbackInLocation(loc: Location = window.location): boolean {
  const q = loc.search || ''
  if (/[?&]code=/.test(q) || /[?&]error=/.test(q)) return true
  const hash = loc.hash || ''
  return /access_token=/.test(hash) || /[?&#]code=/.test(hash)
}
