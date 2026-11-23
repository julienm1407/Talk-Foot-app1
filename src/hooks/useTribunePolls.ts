import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  ensureTribunePoll,
  fetchOfficialPosts,
  fetchTribunePolls,
  voteTribunePoll,
  type OfficialPost,
  type TribunePollOption,
  type TribunePollRow,
} from '../lib/supabase/tribunePolls'

export function useTribunePolls(matchId: string | undefined, voterKey: string | null) {
  const [polls, setPolls] = useState<TribunePollRow[]>([])
  const [officialPosts, setOfficialPosts] = useState<OfficialPost[]>([])

  const reload = useCallback(async () => {
    if (!matchId) {
      setPolls([])
      setOfficialPosts([])
      return
    }
    const [p, o] = await Promise.all([fetchTribunePolls(matchId, voterKey), fetchOfficialPosts(matchId)])
    setPolls(p)
    setOfficialPosts(o)
  }, [matchId, voterKey])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!matchId || !isSupabaseConfigured()) return
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    const ch = sb
      .channel(`tribune-polls:${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tribune_polls', filter: `match_id=eq.${matchId}` }, () => {
        void reload()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tribune_poll_votes' }, () => {
        void reload()
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tribune_official_posts', filter: `match_id=eq.${matchId}` },
        () => {
          void reload()
        },
      )
      .subscribe()
    return () => {
      void sb.removeChannel(ch)
    }
  }, [matchId, reload])

  const activePoll = useMemo(() => {
    if (!polls.length) return null
    return polls[polls.length - 1] ?? null
  }, [polls])

  const ensurePoll = useCallback(
    async (input: {
      question: string
      options: TribunePollOption[]
      kind: string
      triggerKey: string
      officialBody?: string
      minute?: number | null
    }) => {
      if (!matchId) return
      if (polls.some((p) => p.triggerKey === input.triggerKey)) return
      await ensureTribunePoll({ matchId, ...input })
      await reload()
    },
    [matchId, polls, reload],
  )

  const vote = useCallback(
    async (pollId: string, optionId: string) => {
      if (!voterKey) return false
      const ok = await voteTribunePoll(pollId, optionId, voterKey)
      if (ok) await reload()
      return ok
    },
    [reload, voterKey],
  )

  return { polls, activePoll, officialPosts, ensurePoll, vote, reload }
}
