/**
 * Clés publiques RevenueCat (goog_ / appl_) pour le shell Capacitor.
 * Lues au runtime Vercel — pas besoin d’un rebuild Vite si tu mets
 * VITE_REVENUECAT_ANDROID_API_KEY ou REVENUECAT_ANDROID_API_KEY.
 */
import { handleCapacitorCors } from './corsCapacitor.js'

function publicKey(value) {
  const k = String(value || '').trim()
  if (!k) return null
  if (k.startsWith('sk_') || k.startsWith('secret')) return null
  return k
}

export default async function handler(req, res) {
  if (handleCapacitorCors(req, res)) return

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    res.end('Method Not Allowed')
    return
  }

  const android = publicKey(
    process.env.VITE_REVENUECAT_ANDROID_API_KEY ||
      process.env.REVENUECAT_ANDROID_API_KEY ||
      process.env.VITE_REVENUECAT_API_KEY ||
      process.env.REVENUECAT_API_KEY,
  )
  const ios = publicKey(
    process.env.VITE_REVENUECAT_IOS_API_KEY ||
      process.env.REVENUECAT_IOS_API_KEY ||
      process.env.VITE_REVENUECAT_API_KEY ||
      process.env.REVENUECAT_API_KEY,
  )

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=60')
  res.end(JSON.stringify({ android, ios }))
}
