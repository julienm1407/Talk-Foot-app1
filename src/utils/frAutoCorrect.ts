/** Correcteur français local (sans IA) : fautes fréquentes + élisions. */

const WORD_REPLACEMENTS: Record<string, string> = {
  cest: "c'est",
  cetait: "c'était",
  cetais: "c'étais",
  ca: 'ça',
  jai: "j'ai",
  jaime: "j'aime",
  jétais: "j'étais",
  jetais: "j'étais",
  jesuis: 'je suis',
  nest: "n'est",
  netait: "n'était",
  netais: "n'étais",
  sest: "s'est",
  setait: "s'était",
  daccord: "d'accord",
  dailleurs: "d'ailleurs",
  dabord: "d'abord",
  aujourdhui: "aujourd'hui",
  lequipe: "l'équipe",
  lautre: "l'autre",
  lon: "l'on",
  quil: "qu'il",
  quon: "qu'on",
  questce: "qu'est-ce",
  parceque: 'parce que',
  parcontre: 'par contre',
  enfaite: 'en fait',
  enfaitee: 'en fait',
  peutetre: 'peut-être',
  malgres: 'malgré',
  vraimment: 'vraiment',
  vrament: 'vraiment',
  mainteannt: 'maintenant',
  maintenat: 'maintenant',
  apparament: 'apparemment',
  apparamentt: 'apparemment',
  compostion: 'composition',
  compostions: 'compositions',
  indisponnible: 'indisponible',
  indisponibles: 'indisponibles',
  millieu: 'milieu',
  millieux: 'milieux',
  attaqant: 'attaquant',
  attaqants: 'attaquants',
  defenseur: 'défenseur',
  defenseurs: 'défenseurs',
  defensseur: 'défenseur',
  remplacant: 'remplaçant',
  remplacants: 'remplaçants',
  entraineur: 'entraîneur',
  entraineurs: 'entraîneurs',
  horsjeu: 'hors-jeu',
  peanlty: 'penalty',
  penalite: 'penalty',
  footbal: 'football',
  ptetre: 'peut-être',
}

const SKIP_TYPES = new Set([
  'password',
  'email',
  'url',
  'tel',
  'number',
  'search',
  'hidden',
  'date',
  'datetime-local',
  'time',
  'month',
  'week',
  'color',
  'range',
  'file',
  'checkbox',
  'radio',
])

const TOKEN_RE =
  /https?:\/\/\S+|www\.\S+|@[A-Za-z0-9_]+|#[A-Za-zÀ-ÿ0-9_]+|[A-Za-zÀ-ÿœŒæÆ]+(?:'[A-Za-zÀ-ÿœŒæÆ]+)?|[^A-Za-zÀ-ÿœŒæÆ@#]+/g

function applyCase(from: string, to: string): string {
  if (from.length > 1 && from === from.toUpperCase()) return to.toUpperCase()
  if (from.charAt(0) === from.charAt(0).toUpperCase()) {
    return to.charAt(0).toUpperCase() + to.slice(1)
  }
  return to
}

function correctWord(raw: string): string {
  if (!raw || /https?:|www\.|^@|^#/.test(raw)) return raw
  if (raw === 'CA') return raw
  const key = raw
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/'/g, '')
  const mapped = WORD_REPLACEMENTS[key]
  if (!mapped) return raw
  return applyCase(raw, mapped)
}

function rewriteTokens(text: string, skipLastWord: boolean): string {
  const parts = text.match(TOKEN_RE)
  if (!parts) return text
  let lastWordIdx = -1
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/^[A-Za-zÀ-ÿœŒæÆ]/.test(parts[i]!)) {
      lastWordIdx = i
      break
    }
  }
  return parts
    .map((part, i) => {
      if (!/^[A-Za-zÀ-ÿœŒæÆ]/.test(part)) return part
      if (skipLastWord && i === lastWordIdx) return part
      return correctWord(part)
    })
    .join('')
}

/** Corrige les mots déjà « fermés » (espace / ponctuation après). */
export function correctFrenchTyping(text: string, includeTrailingWord = false): string {
  return rewriteTokens(text, !includeTrailingWord)
}

/** Corrige tout le texte (envoi / blur). */
export function correctFrenchText(text: string): string {
  return rewriteTokens(text, false)
}

export function isSensitiveTextField(el: HTMLInputElement | HTMLTextAreaElement): boolean {
  if (el instanceof HTMLInputElement && SKIP_TYPES.has(el.type)) return true
  const ac = (el.getAttribute('autocomplete') ?? '').toLowerCase()
  if (ac.includes('password') || ac.includes('username') || ac.includes('email') || ac.includes('one-time')) {
    return true
  }
  if (el.getAttribute('data-tf-spellcheck') === 'off') return true
  return false
}

/** Attributs natifs (clavier iOS / Android / soulignement navigateur). */
export const FR_SPELLCHECK_ATTRS = {
  lang: 'fr' as const,
  spellCheck: true as const,
  autoCorrect: 'on' as const,
  autoCapitalize: 'sentences' as const,
}

export function applyNativeFrenchSpellcheck(el: HTMLInputElement | HTMLTextAreaElement): void {
  if (el.isContentEditable) return
  if (isSensitiveTextField(el)) {
    el.spellcheck = false
    el.setAttribute('autocorrect', 'off')
    el.setAttribute('autocapitalize', 'off')
    return
  }
  if (!el.lang) el.lang = 'fr'
  if (el.getAttribute('spellcheck') !== 'false') el.spellcheck = true
  if (!el.hasAttribute('autocorrect')) el.setAttribute('autocorrect', 'on')
  if (!el.hasAttribute('autocapitalize')) el.setAttribute('autocapitalize', 'sentences')
}

export function applyFrenchLiveCorrection(
  el: HTMLInputElement | HTMLTextAreaElement,
  nativeEvent: Event | undefined,
  includeTrailingWord = false,
): string {
  if (nativeEvent && 'isComposing' in nativeEvent && (nativeEvent as InputEvent).isComposing) {
    return el.value
  }
  const inputType = nativeEvent && 'inputType' in nativeEvent ? String((nativeEvent as InputEvent).inputType ?? '') : ''
  if (inputType.startsWith('delete') || inputType === 'historyUndo' || inputType === 'historyRedo') {
    return el.value
  }
  const next = correctFrenchTyping(el.value, includeTrailingWord)
  if (next === el.value) return el.value
  const start = el.selectionStart
  const end = el.selectionEnd
  const delta = next.length - el.value.length
  el.value = next
  if (typeof start === 'number' && typeof end === 'number') {
    const ns = Math.max(0, start + delta)
    const ne = Math.max(0, end + delta)
    try {
      el.setSelectionRange(ns, ne)
    } catch {
      /* champs non textuels */
    }
  }
  return next
}
