import type { CSSProperties } from 'react'
import { GROUP_SALON_BG_PRESETS } from '../data/groupSalonPresets'
import type { SupporterGroup } from '../types/group'

/** Style du fil + bordure pour la carte chat d’un salon groupe. */
export function getGroupSalonChatSurfaceStyles(
  group: SupporterGroup,
  opts?: { dark?: boolean },
): {
  backdrop: CSSProperties
  boxBorderColor: string
} {
  const t = group.theme
  const dark = Boolean(opts?.dark)
  const boxBorderColor =
    t.salonBoxBorder?.trim() || t.accent?.trim() || t.secondary || '#cbd5e1'

  const backdrop: CSSProperties = {}
  const bd = t.salonChatBackdrop

  if (!bd || bd.mode === 'inherit') {
    const p = t.primary
    const s = t.secondary
    if (dark) {
      if (t.background === 'stripe') {
        backdrop.background = `linear-gradient(90deg, color-mix(in srgb, ${p} 16%, #0b1220), transparent 65%), repeating-linear-gradient(135deg, color-mix(in srgb, ${p} 9%, #0b1220) 0 10px, #0b1220 10px 20px)`
      } else if (t.background === 'smoke') {
        backdrop.background = `radial-gradient(800px 200px at 10% 0%, color-mix(in srgb, ${p} 20%, #0b1220), transparent 60%), radial-gradient(800px 220px at 90% 0%, color-mix(in srgb, ${s} 13%, #0b1220), transparent 62%), linear-gradient(180deg, #0b1220 0%, #0f1b33 100%)`
      } else {
        backdrop.background = `linear-gradient(100deg, color-mix(in srgb, ${p} 12%, #0b1220), #0f1b33 58%)`
      }
    } else if (t.background === 'stripe') {
      backdrop.background = `linear-gradient(90deg, color-mix(in srgb, ${p} 18%, #f8fafc), transparent 65%), repeating-linear-gradient(135deg, color-mix(in srgb, ${p} 10%, #f8fafc) 0 10px, #f8fafc 10px 20px)`
    } else if (t.background === 'smoke') {
      backdrop.background = `radial-gradient(800px 200px at 10% 0%, color-mix(in srgb, ${p} 20%, #f8fafc), transparent 60%), radial-gradient(800px 220px at 90% 0%, color-mix(in srgb, ${s} 14%, #f8fafc), transparent 62%), #f8fafc`
    } else {
      backdrop.background = `linear-gradient(100deg, color-mix(in srgb, ${p} 12%, #fff), #f8fafc 55%)`
    }
  } else if (bd.mode === 'solid') {
    backdrop.background = bd.color
  } else {
    const preset = GROUP_SALON_BG_PRESETS[bd.presetId]
    Object.assign(backdrop, preset?.style ?? { background: '#f1f5f9' })
  }

  return { backdrop, boxBorderColor }
}

export function getGroupQuickEmotes(group: SupporterGroup): string[] {
  const raw = group.theme.quickEmotes?.filter(Boolean) ?? []
  const cleaned = raw.map((e) => e.trim()).filter(Boolean).slice(0, 8)
  if (cleaned.length > 0) return cleaned
  return ['⚽', '🔥', '👏', '😤', '💪', '❤️']
}
