/**
 * Hachage côté navigateur (PBKDF2) — les mots de passe ne sont plus stockés en clair dans localStorage.
 * Remplace une authentification serveur ; en production, le secret ne doit pas vivre uniquement chez le client.
 */
const PBKDF2_ITERATIONS = 210_000

function saltFromB64(saltB64: string): Uint8Array {
  const bin = atob(saltB64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function pbkdf2Digest(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const saltBuf = new Uint8Array(salt.length)
  saltBuf.set(salt)
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuf, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const bytes = new Uint8Array(bits)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function timingSafeEqualB64(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

export async function hashPasswordForStorage(password: string): Promise<{ salt: string; passwordHash: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  let bin = ''
  for (let i = 0; i < saltBytes.length; i++) bin += String.fromCharCode(saltBytes[i])
  const salt = btoa(bin)
  const passwordHash = await pbkdf2Digest(password, saltFromB64(salt))
  return { salt, passwordHash }
}

export async function verifyPasswordAgainstStored(
  password: string,
  saltB64: string | undefined,
  passwordHashB64: string | undefined,
): Promise<boolean> {
  if (!saltB64 || !passwordHashB64) return false
  const computed = await pbkdf2Digest(password, saltFromB64(saltB64))
  return timingSafeEqualB64(computed, passwordHashB64)
}
