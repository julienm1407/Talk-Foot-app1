import { useMemo, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useMatches } from '../../contexts/MatchesContext'
import { matchCalendarDayKeyParis } from '../../utils/time'
import { pickTalkFootHomeBoard } from '../../utils/talkFootMatchOfTheDay'
import {
  readTalkFootEditorial,
  resetTalkFootEditorialOverlay,
  writeTalkFootEditorialOverlay,
} from '../../utils/talkFootEditorialStore'

export function TalkFootMatchAdminCard() {
  const { matches } = useMatches()
  const [tick, setTick] = useState(0)
  const editorial = useMemo(() => {
    void tick
    return readTalkFootEditorial()
  }, [tick])
  const today = matchCalendarDayKeyParis(new Date())
  const board = useMemo(() => pickTalkFootHomeBoard(matches, new Date(), editorial), [matches, editorial])
  const todayMatches = matches.filter((m) => matchCalendarDayKeyParis(m.kickoffAt) === today)
  const [pairDraft, setPairDraft] = useState('')

  const refresh = () => setTick((n) => n + 1)

  return (
    <Card className="p-4">
      <h2 className="font-display text-lg font-black text-tf-app-fg">Match Talk Foot</h2>
      <p className="mt-1 text-xs font-semibold text-tf-app-muted">
        Priorité PSG du jour, puis choc L1 / club L1 en Europe. Les listes se sauvent sur cet appareil ; pour tout le
        monde, édite aussi <code className="font-mono">src/data/talkFootEditorial.ts</code>.
      </p>
      <p className="mt-3 text-sm font-bold text-tf-app-fg">
        Aujourd’hui : {board.featured ? `${board.featured.home.shortName} – ${board.featured.away.shortName}` : 'aucun'}
      </p>
      <label className="mt-3 block text-[11px] font-black uppercase tracking-wide text-tf-app-muted">
        Forcer le match du {today}
      </label>
      <select
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
        value={editorial.forceByDay[today] ?? ''}
        onChange={(e) => {
          const forceByDay = { ...editorial.forceByDay }
          if (e.target.value) forceByDay[today] = e.target.value
          else delete forceByDay[today]
          writeTalkFootEditorialOverlay({ forceByDay })
          refresh()
        }}
      >
        <option value="">Automatique</option>
        {todayMatches.map((m) => (
          <option key={m.id} value={m.id}>
            {m.home.shortName} – {m.away.shortName} ({m.competition.shortName})
          </option>
        ))}
      </select>
      <p className="mt-4 text-[11px] font-black uppercase tracking-wide text-tf-app-muted">Chocs Ligue 1</p>
      <ul className="mt-1 space-y-1 text-sm font-semibold">
        {editorial.chocPairs.map(([a, b]) => (
          <li key={`${a}-${b}`} className="flex items-center justify-between gap-2">
            <span>
              {a} – {b}
            </span>
            <button
              type="button"
              className="text-xs font-black text-rose-600"
              onClick={() => {
                writeTalkFootEditorialOverlay({
                  chocPairs: editorial.chocPairs.filter(([x, y]) => !(x === a && y === b)),
                })
                refresh()
              }}
            >
              Retirer
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          value={pairDraft}
          onChange={(e) => setPairDraft(e.target.value)}
          placeholder="om,nice"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <Button
          type="button"
          className="rounded-xl px-3 text-xs"
          onClick={() => {
            const [a, b] = pairDraft.split(',').map((s) => s.trim().toLowerCase())
            if (!a || !b) return
            writeTalkFootEditorialOverlay({ chocPairs: [...editorial.chocPairs, [a, b]] })
            setPairDraft('')
            refresh()
          }}
        >
          Ajouter
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="mt-3 rounded-xl text-xs"
        onClick={() => {
          resetTalkFootEditorialOverlay()
          refresh()
        }}
      >
        Réinitialiser les listes
      </Button>
    </Card>
  )
}
