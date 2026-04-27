/**
 * Traduction affichage des textes live SportMonks (souvent en anglais) → français.
 * Règles par motifs : noms d’équipes / joueurs conservés via groupes de capture.
 */

const SENTENCE_RULES: Array<{ re: RegExp; fr: string }> = [
  {
    re: /^Corner awarded to (.+?) after a concession by (.+?)\.?$/i,
    fr: 'Corner pour $1 après une concession de $2.',
  },
  {
    re: /^Corner awarded to (.+?) after (?:a foul|an infringement) by (.+?)\.?$/i,
    fr: 'Corner pour $1 après une faute de $2.',
  },
  {
    re: /^Corner awarded to (.+?)\.?$/i,
    fr: 'Corner pour $1.',
  },
  {
    re: /^Free kick awarded to (.+?)\.?$/i,
    fr: 'Coup franc pour $1.',
  },
  {
    re: /^Free kick (.+?)\.?$/i,
    fr: 'Coup franc — $1.',
  },
  {
    re: /^Throw-?in awarded to (.+?)\.?$/i,
    fr: 'Touche accordée à $1.',
  },
  {
    re: /^Penalty awarded to (.+?)\.?$/i,
    fr: 'Penalty accordé à $1.',
  },
  {
    re: /^Goal!?\s*(.+)$/i,
    fr: 'But ! $1',
  },
  {
    re: /^Goal scored by (.+?)\.?$/i,
    fr: 'But marqué par $1.',
  },
  {
    re: /^The referee blows for half[\s-]?time\.?$/i,
    fr: "L'arbitre siffle la mi-temps.",
  },
  {
    re: /^The referee blows for full[\s-]?time\.?$/i,
    fr: "L'arbitre siffle la fin du match.",
  },
  {
    re: /^The referee has (?:added|indicated) (\d+) minutes? of (?:injury|stoppage) time\.?$/i,
    fr: "L'arbitre a indiqué $1 minute(s) de jeu additionnel.",
  },
  {
    re: /^Second yellow card for (.+?)\.?$/i,
    fr: 'Second carton jaune pour $1.',
  },
  {
    re: /^Yellow card for (.+?)\.?$/i,
    fr: 'Carton jaune pour $1.',
  },
  {
    re: /^Red card for (.+?)\.?$/i,
    fr: 'Carton rouge pour $1.',
  },
  {
    re: /^Substitution,?\s+(.+?):\s*(.+?)\s+(?:is replaced by|replaced by)\s+(.+?)\.?$/i,
    fr: 'Changement pour $1 : $2 remplacé par $3.',
  },
  {
    re: /^Offside,?\s+(.+?)\.?$/i,
    fr: 'Hors-jeu, $1.',
  },
  {
    re: /^Offside against (.+?)\.?$/i,
    fr: 'Hors-jeu contre $1.',
  },
  {
    re: /^Foul by (.+?)\.?$/i,
    fr: 'Faute de $1.',
  },
  {
    re: /^Hand ball by (.+?)\.?$/i,
    fr: 'Main de $1.',
  },
  {
    re: /^(.+?)\s+wins a free kick\.?$/i,
    fr: '$1 obtient un coup franc.',
  },
  {
    re: /^Attempt saved\.?\s*(.+)$/i,
    fr: 'Arrêt du gardien. $1',
  },
  {
    re: /^Attempt missed\.?\s*(.+)$/i,
    fr: 'Tir non cadré. $1',
  },
  {
    re: /^Attempt blocked\.?\s*(.+)$/i,
    fr: 'Tir contré. $1',
  },
]

/** Règles avec fonction de remplacement (dernier recours pour motifs variables). */
const SENTENCE_RULES_FN: Array<{ re: RegExp; fn: (m: RegExpMatchArray) => string }> = [
  {
    re: /^Shot (?:off target|on target|blocked)\.?\s*(.*)$/i,
    fn: (m) => {
      const rest = (m[1] ?? '').trim()
      const head = m[0].toLowerCase()
      const label = head.includes('on target') ? 'Tir cadré' : head.includes('blocked') ? 'Tir contré' : 'Tir non cadré'
      return rest ? `${label}. ${rest}` : `${label}.`
    },
  },
]

function applySentenceRules(s: string): string {
  const t = s.trim()
  if (!t) return t
  for (const { re, fr } of SENTENCE_RULES) {
    if (typeof fr === 'string' && re.test(t)) {
      return t.replace(re, fr).replace(/\.\.$/, '.')
    }
  }
  for (const { re, fn } of SENTENCE_RULES_FN) {
    const m = t.match(re)
    if (m) return fn(m)
  }
  return t
}

const INLINE_PHRASES: Array<[RegExp, string]> = [
  [/ awarded to /gi, ' pour '],
  [/ after a concession by /gi, ' après une concession de '],
  [/ after an infringement by /gi, ' après une faute de '],
  [/ after a foul by /gi, ' après une faute de '],
  [/ after (?:a|the) foul by /gi, ' après une faute de '],
  [/The referee/gi, "L'arbitre"],
  [/Kick-?off/gi, 'Coup d’envoi'],
  [/half[\s-]?time/gi, 'mi-temps'],
  [/full[\s-]?time/gi, 'fin du match'],
  [/corner kick/gi, 'corner'],
  [/free kick/gi, 'coup franc'],
  [/yellow card/gi, 'carton jaune'],
  [/red card/gi, 'carton rouge'],
  [/substitution/gi, 'changement'],
  [/possession/gi, 'possession'],
  [/dangerous attack/gi, 'attaque dangereuse'],
  [/attack\b/gi, 'attaque'],
  [/saved\.?/gi, 'arrêté.'],
  [/missed\.?/gi, 'raté.'],
  [/blocked\.?/gi, 'contré.'],
]

/** Premiers jetons type « TYPE · joueur » (events SM). */
const LEADING_EVENT_TOKEN: Array<[RegExp, string]> = [
  [/^(VAR[^·]*)/i, 'VAR'],
  [/^(CORNER)\b/i, 'Corner'],
  [/^(GOAL)\b/i, 'But'],
  [/^(YELLOWCARD|YELLOW_CARD)\b/i, 'Carton jaune'],
  [/^(REDCARD|RED_CARD)\b/i, 'Carton rouge'],
  [/^(SUBSTITUTION|SUB)\b/i, 'Changement'],
  [/^(OFFSIDE)\b/i, 'Hors-jeu'],
  [/^(FREE_KICK|FREEKICK)\b/i, 'Coup franc'],
  [/^(PENALTY)\b/i, 'Penalty'],
  [/^(THROW[_\s-]?IN)\b/i, 'Touche'],
  [/^(SHOT(?:OFFTARGET|ONTARGET|BLOCKED)?)\b/i, 'Tir'],
  [/^(PENALTY_MISSED|PENALTY_SAVED)\b/i, 'Penalty'],
]

function translateLeadingEventToken(s: string): string {
  const t = s.trim()
  if (!t) return t
  const dot = t.indexOf(' · ')
  if (dot === -1) {
    for (const [re, fr] of LEADING_EVENT_TOKEN) {
      if (re.test(t)) return t.replace(re, fr)
    }
    return t
  }
  const head = t.slice(0, dot)
  const tail = t.slice(dot)
  let nh = head
  for (const [re, fr] of LEADING_EVENT_TOKEN) {
    if (re.test(nh)) {
      nh = nh.replace(re, fr)
      break
    }
  }
  return nh + tail
}

/**
 * Texte brut commentaire / libellé event → français quand des motifs anglais connus sont détectés.
 */
export function translateSportMonksLiveTextToFr(raw: string): string {
  const s = String(raw ?? '').trim()
  if (!s) return s

  const fromRules = applySentenceRules(s)
  if (fromRules !== s) return fromRules

  const looksEn =
    /\b(the|and|after|before|awarded|corner|kick|foul|card|substitution|referee|goal|goals?|offside|penalty|attempt|saved|missed|blocked|concession|injury|stoppage)\b/i.test(
      s,
    )

  let out = s
  if (looksEn) {
    for (const [re, rep] of INLINE_PHRASES) {
      out = out.replace(re, rep)
    }
    out = translateLeadingEventToken(out)
    if (out !== s) return out.trim()
  } else {
    out = translateLeadingEventToken(s)
  }

  return out.trim()
}
