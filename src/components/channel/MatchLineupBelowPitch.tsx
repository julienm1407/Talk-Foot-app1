import { useState } from 'react'
import type { LineupCoach } from '../../api/sportMonks/extractCoachesFromSmFixture'
import type { SidelinedPlayer } from '../../api/sportMonks/extractSidelinedFromSm'
import type { SmStartingXiPlayer } from '../../api/sportMonks/extractStartingXisFromSmFixture'
import { cn } from '../../utils/cn'
import {
  MatchLineupSubstitutes,
  type LineupSubstituteWithOverlay,
} from './MatchLineupSubstitutes'

function initials(name: string): string {
  const parts = name.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function positionFr(raw?: string): string | undefined {
  if (!raw) return undefined
  const t = raw.toLowerCase()
  if (t.includes('goal') || t.includes('gard')) return 'Gardien'
  if (t.includes('defen') || t.includes('back') || t.includes('centre-back')) return 'Défenseur'
  if (t.includes('mid') || t.includes('milieu')) return 'Milieu'
  if (t.includes('wing') || t.includes('ailier')) return 'Ailier'
  if (t.includes('attack') || t.includes('forward') || t.includes('striker') || t.includes('attaq')) {
    return 'Attaquant'
  }
  return raw
}

function MiniFace({
  photoUrl,
  name,
  light,
}: {
  photoUrl?: string
  name: string
  light?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const show = photoUrl && !failed
  return (
    <div
      className={cn(
        'relative h-7 w-7 shrink-0 overflow-hidden rounded-full border bg-white',
        light ? 'border-white/90' : 'border-white/70',
      )}
    >
      {show ? (
        <img
          src={photoUrl}
          alt=""
          className="h-full w-full object-cover object-top"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center text-[7px] font-black',
            light ? 'bg-sky-100 text-sky-900/70' : 'bg-[#0a1f35] text-sky-100/85',
          )}
        >
          {initials(name)}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children, light }: { children: string; light?: boolean }) {
  return (
    <p
      className={cn(
        'text-[9px] font-black uppercase tracking-[0.14em]',
        light ? 'text-sky-900/55' : 'text-sky-100/45',
      )}
    >
      {children}
    </p>
  )
}

function PlayerLine({
  name,
  number,
  meta,
  photoUrl,
  light,
}: {
  name: string
  number?: string
  meta?: string
  photoUrl?: string
  light?: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <MiniFace photoUrl={photoUrl} name={name} light={light} />
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-[10px] font-bold', light ? 'text-[#023458]' : 'text-sky-50')}>
          {number ? <span className="mr-1 tabular-nums opacity-70">{number}</span> : null}
          {name}
        </p>
        {meta ? (
          <p className={cn('truncate text-[8px] font-medium', light ? 'text-sky-900/50' : 'text-sky-200/55')}>
            {meta}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function MatchLineupBelowPitch({
  coach,
  bench,
  absences,
  substitutes,
  showSubstitutes,
  hasStarters,
  light,
}: {
  coach: LineupCoach | null
  bench: SmStartingXiPlayer[]
  absences: SidelinedPlayer[]
  substitutes: LineupSubstituteWithOverlay[]
  showSubstitutes?: boolean
  hasStarters: boolean
  light?: boolean
}) {
  const showBench = hasStarters
  if (!coach && !showBench && !absences.length && !showSubstitutes) return null

  return (
    <div className="mt-2 space-y-2.5">
      {coach ? (
        <div className="space-y-1">
          <SectionLabel light={light}>Entraîneur</SectionLabel>
          <PlayerLine name={coach.name} photoUrl={coach.photoUrl} light={light} />
        </div>
      ) : null}

      {showBench ? (
        <div className="space-y-1">
          <SectionLabel light={light}>Remplaçants</SectionLabel>
          {bench.length ? (
            <div className="grid grid-cols-1 gap-1.5">
              {bench.map((p) => (
                <PlayerLine
                  key={`bench-${p.playerId ?? p.label}`}
                  name={p.label}
                  number={p.number}
                  meta={positionFr(p.positionLabel)}
                  photoUrl={p.photoUrl}
                  light={light}
                />
              ))}
            </div>
          ) : (
            <p className={cn('text-[9px] font-medium', light ? 'text-sky-900/45' : 'text-sky-200/45')}>
              Banc non communiqué.
            </p>
          )}
        </div>
      ) : null}

      {showSubstitutes ? (
        <MatchLineupSubstitutes
          home={substitutes}
          away={[]}
          showWhenEmpty
          light={light}
          className="mt-0"
        />
      ) : null}

      {absences.length ? (
        <div className="space-y-1">
          <SectionLabel light={light}>Absents</SectionLabel>
          <div className="grid grid-cols-1 gap-1.5">
            {absences.map((p) => (
              <PlayerLine
                key={`abs-${p.playerId ?? p.name}`}
                name={p.name}
                meta={p.reason}
                photoUrl={p.photoUrl}
                light={light}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
