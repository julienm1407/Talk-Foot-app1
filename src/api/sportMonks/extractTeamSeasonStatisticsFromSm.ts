export type TeamSeasonStatRow = {
  key: string
  label: string
  value: number
}

function num(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'object' && raw !== null && 'total' in raw) {
    return num((raw as { total?: unknown }).total)
  }
  const n = Number(String(raw).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function labelFromType(t: unknown): { key: string; label: string } | null {
  if (!t || typeof t !== 'object') return null
  const o = t as { developer_name?: string; name?: string }
  const dev = String(o.developer_name ?? '').trim()
  const name = String(o.name ?? '').trim()
  const key = (dev || name).toLowerCase().replace(/\s+/g, '_') || 'stat'
  const label = name || dev || key
  return { key, label }
}

/**
 * Aplatit une réponse équipe avec `statistics.details.type` (ex. `GET /teams/{id}` +
 * `filters=teamstatisticSeasons:{seasonId}`, ou ancienne forme `/teams/seasons/…` si `data.statistics` présent).
 */
export function extractTeamSeasonStatisticsFromSmPayload(payload: unknown): TeamSeasonStatRow[] {
  const root =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data: unknown }).data
      : payload
  if (!root || typeof root !== 'object') return []

  const stats = (root as { statistics?: unknown }).statistics
  if (!Array.isArray(stats)) return []

  const out: TeamSeasonStatRow[] = []
  const seen = new Set<string>()

  for (const block of stats) {
    if (!block || typeof block !== 'object') continue
    const b = block as {
      type?: unknown
      details?: unknown[]
      value?: unknown
      data?: { value?: unknown }
    }

    if (Array.isArray(b.details)) {
      for (const d of b.details) {
        if (!d || typeof d !== 'object') continue
        const row = d as { type?: unknown; value?: unknown; data?: { value?: unknown } }
        const meta = labelFromType(row.type)
        if (!meta) continue
        const v = num(row.value ?? row.data?.value)
        if (v == null) continue
        const k = meta.key
        if (seen.has(k)) continue
        seen.add(k)
        out.push({ key: k, label: meta.label, value: Math.round(v * 10) / 10 })
      }
      continue
    }

    const meta = labelFromType(b.type)
    if (!meta) continue
    const v = num(b.value ?? b.data?.value)
    if (v == null) continue
    const k = meta.key
    if (seen.has(k)) continue
    seen.add(k)
    out.push({ key: k, label: meta.label, value: Math.round(v * 10) / 10 })
  }

  return out.slice(0, 40)
}
