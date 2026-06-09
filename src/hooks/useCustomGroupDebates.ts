import { useCallback, useMemo } from 'react'
import type { Debate } from '../data/debates'
import { STANDALONE_DEBATES_BUCKET_KEY } from '../constants/debates'
import { useAuth } from '../contexts/AuthContext'
import { useDebates } from '../contexts/DebatesContext'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { upsertPublishedDebate } from '../lib/supabase/debates'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { ensureTalkFootSupabaseSession } from '../lib/supabase/talkfootSession'
import {
  CUSTOM_GROUP_DEBATES_KEY,
  createCustomGroupDebateRecord,
  type CustomDebatesBucket,
} from '../utils/customGroupDebatesStorage'
import { moderateDebateInput } from '../utils/bannedWords'
import { useLocalStorageState } from './useLocalStorage'
import { useSubscription } from './useSubscription'
import { bumpDebateUsage, canCreateDebate } from '../utils/subscriptionEntitlements'
import { useXpGrant } from './useXpGrant'

const isBucket = (p: unknown): p is CustomDebatesBucket =>
  p !== null && typeof p === 'object' && !Array.isArray(p)

function resolveBucketKey(groupId: string | null | undefined): string | undefined {
  if (groupId === undefined) return undefined
  return groupId ?? STANDALONE_DEBATES_BUCKET_KEY
}

/**
 * `groupId` :
 * - `string` : débats liés à une tribune
 * - `null` : débats autonomes (sans tribune)
 * - `undefined` : hook inactif
 */
export function useCustomGroupDebates(groupId: string | null | undefined) {
  const { user: authUser } = useAuth()
  const isAdmin = Boolean(authUser?.isAdmin)
  const { tier, subscription, patchUsage } = useSubscription()
  const { grantDebateCreated } = useXpGrant()
  const { favoriteClubIds } = useFanPreferences()
  const { refresh: refreshDebates } = useDebates()
  const fanClubId = favoriteClubIds[0] ?? 'psg'
  const username = authUser?.displayName ?? 'Toi'
  const bucketKey = resolveBucketKey(groupId)
  const linkedGroupId = groupId === undefined ? undefined : groupId

  const [bucket, setBucket] = useLocalStorageState<CustomDebatesBucket>(
    CUSTOM_GROUP_DEBATES_KEY,
    {},
    isBucket,
  )

  const customForGroup = useMemo(
    () => (bucketKey ? bucket[bucketKey] ?? [] : []),
    [bucket, bucketKey],
  )

  const addCustomDebate = useCallback(
    (
      input: { title: string; excerpt: string; accent: string },
    ): { ok: true; debate: Debate } | { ok: false; reason: string } => {
      if (!bucketKey || linkedGroupId === undefined) {
        return { ok: false, reason: 'Contexte de publication introuvable.' }
      }
      const debateGate = canCreateDebate(tier, subscription.usage ?? {}, new Date(), isAdmin)
      if (!debateGate.ok) {
        return { ok: false, reason: debateGate.reason ?? 'Limite de débats atteinte.' }
      }
      if (!moderateDebateInput(input).ok) {
        return { ok: false, reason: 'Contenu refusé par la modération.' }
      }
      if (!isAdmin) patchUsage((u) => bumpDebateUsage(u))
      const debate = createCustomGroupDebateRecord(input, username, fanClubId, linkedGroupId)
      setBucket((prev) => {
        const nextList = [...(prev[bucketKey] ?? []), debate].slice(-50)
        return { ...prev, [bucketKey]: nextList }
      })
      if (isSupabaseConfigured()) {
        const sb = getSupabaseBrowserClient()
        if (sb) {
          void (async () => {
            const session = await ensureTalkFootSupabaseSession(sb)
            if (!session) return
            const res = await upsertPublishedDebate(sb, {
              id: debate.id,
              groupId: debate.groupId,
              title: debate.title,
              excerpt: debate.excerpt,
              accent: debate.accent,
              salonAccess: debate.salonAccess ?? 'public',
            })
            if (res.ok) await refreshDebates()
          })()
        }
      } else {
        void refreshDebates()
      }
      grantDebateCreated(debate.id)
      return { ok: true, debate }
    },
    [
      bucketKey,
      fanClubId,
      grantDebateCreated,
      isAdmin,
      linkedGroupId,
      refreshDebates,
      setBucket,
      username,
      tier,
      subscription.usage,
      patchUsage,
    ],
  )

  const canAddDebate = canCreateDebate(tier, subscription.usage ?? {}, new Date(), isAdmin).ok

  return { customForGroup, addCustomDebate, canAddDebate }
}
