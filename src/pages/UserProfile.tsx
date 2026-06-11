import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDirectMessagesContext } from '../contexts/DirectMessagesContext'
import { usePrivateMessagesUi } from '../contexts/PrivateMessagesUiContext'
import { TALKFOOT_BOT_DM_THREAD_ID, friendDmThreadId } from '../data/directMessageConstants'
import { resolveProfilePeer } from '../data/users'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { UserProfileAvatar } from '../components/profile/UserProfileAvatar'
import { FriendPronosticsPanel } from '../components/social/FriendPronosticsPanel'
import { useFriendPronostics } from '../hooks/useFriendPronostics'
import { usePeerPublicProfile } from '../hooks/usePeerPublicProfile'
import { useTalkFootChatActorId } from '../hooks/useTalkFootChatActorId'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { cn } from '../utils/cn'
import { useAppearance } from '../contexts/AppearanceContext'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { getSupabaseBrowserClient } from '../lib/supabase/client'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function UserProfilePage() {
  const { userId = '' } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const pm = usePrivateMessagesUi()
  const dm = useDirectMessagesContext()
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  const peer = resolveProfilePeer(userId)
  const viewerActorId = useTalkFootChatActorId()
  const [liveName, setLiveName] = useState<string | null>(null)
  const [friendActionHint, setFriendActionHint] = useState<string | null>(null)
  const [friendBusy, setFriendBusy] = useState(false)

  useEffect(() => {
    if (authUser?.id && userId && authUser.id === userId) {
      navigate('/profile', { replace: true })
    }
  }, [authUser?.id, userId, navigate])

  useEffect(() => {
    if (!peer || !authUser?.id || !isSupabaseConfigured()) return
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    if (UUID_RE.test(peer.id)) {
      void sb
        .from('profiles')
        .select('display_name')
        .eq('id', peer.id)
        .maybeSingle()
        .then(({ data }) => {
          const n = data?.display_name?.trim()
          if (n) setLiveName(n)
        })
      return
    }
    // Compat Clerk: fallback sur `profiles.clerk_id` (texte) si `peer.id` n'est pas un UUID.
    void sb
      .from('profiles')
      .select('display_name')
      .eq('clerk_id', peer.id)
      .maybeSingle()
      .then(({ data }) => {
        const n = data?.display_name?.trim()
        if (n) setLiveName(n)
      })
  }, [userId, authUser?.id, peer])

  const { cloudProfile, loading: profileLoading } = usePeerPublicProfile(peer ?? undefined, authUser?.id)

  const useCloudFriends = isSupabaseConfigured() && Boolean(authUser?.id)
  const isFriend = Boolean(
    peer &&
      (peer.isTalkFootBot ||
        dm.isCloudFriend(peer.id) ||
        (!useCloudFriends && Boolean(peer.isMockFriend))),
  )

  const canViewFriendPronostics = Boolean(peer && isFriend && !peer.isTalkFootBot && viewerActorId)

  const friendPronostics = useFriendPronostics({
    friendActorKey: peer?.id,
    viewerActorKey: viewerActorId,
    enabled: canViewFriendPronostics,
  })

  if (!peer) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className={cn('text-xl font-black', L ? 'text-tf-dark' : 'text-white')}>Profil introuvable</h1>
        <p className={cn('text-sm font-semibold', L ? 'text-tf-grey' : 'text-sky-200/85')}>
          Ce joueur n’existe pas ou n’est plus disponible.
        </p>
        <Button type="button" variant="primary" onClick={() => navigate(-1)}>
          Retour
        </Button>
        <Link to="/" className="block text-sm font-bold text-sky-600 underline-offset-2 hover:underline">
          Accueil
        </Link>
      </div>
    )
  }

  const displayUsername = liveName ?? peer.username
  const club = peer.fanClubId ? ALL_CLUBS_BY_ID[peer.fanClubId] : undefined

  const canMessage =
    isFriend ||
    (useCloudFriends && UUID_RE.test(peer.id) && !peer.isTalkFootBot)

  const canAddFriend =
    useCloudFriends &&
    authUser &&
    peer.id !== authUser.id &&
    !peer.isTalkFootBot &&
    UUID_RE.test(peer.id) &&
    !dm.isCloudFriend(peer.id)

  const pendingFromThisUser =
    useCloudFriends &&
    authUser &&
    dm.incomingFriendRequests.some((r) => r.requesterId === peer.id)

  const openPrivateChat = () => {
    if (!peer.isTalkFootBot && UUID_RE.test(peer.id)) {
      dm.registerPeerForPrivateChat({
        id: peer.id,
        username: displayUsername,
        avatarSeed: peer.avatarSeed,
        accent: peer.accent,
      })
    }
    const threadId = peer.isTalkFootBot ? TALKFOOT_BOT_DM_THREAD_ID : friendDmThreadId(peer.id)
    pm.open({ threadId })
  }

  const onAddFriend = async () => {
    setFriendActionHint(null)
    setFriendBusy(true)
    const out = await dm.sendFriendRequest(peer.id)
    setFriendBusy(false)
    if (out.ok) setFriendActionHint('Demande envoyée — l’autre joueur doit accepter.')
    else if (out.error === 'already_exists') setFriendActionHint('Une demande existe déjà.')
    else setFriendActionHint(out.error ?? 'Impossible d’envoyer la demande.')
  }

  const onAcceptFriend = async () => {
    setFriendActionHint(null)
    setFriendBusy(true)
    const out = await dm.acceptFriendRequest(peer.id)
    setFriendBusy(false)
    if (out.ok) setFriendActionHint('Vous êtes maintenant amis — la conversation est dans les messages.')
    else setFriendActionHint(out.error ?? 'Impossible d’accepter.')
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <nav className="text-sm font-bold">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={cn(
            'text-sky-600 underline-offset-2 hover:underline',
            !L && 'text-sky-300 hover:text-sky-200',
          )}
        >
          ← Retour
        </button>
      </nav>

      <Card className="overflow-hidden p-0">
        <div
          className={cn(
            'relative px-6 pb-6 pt-10 sm:px-8 sm:pb-8',
            L
              ? 'bg-gradient-to-br from-sky-50 via-white to-violet-50/80'
              : 'bg-gradient-to-br from-slate-900 via-[#0c1829] to-violet-950/50',
          )}
        >
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <UserProfileAvatar peer={peer} cloudProfile={cloudProfile} profileLoading={profileLoading} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1
                  className={cn(
                    'text-2xl font-black tracking-tight sm:text-3xl',
                    L ? 'text-tf-dark' : 'text-white',
                  )}
                >
                  {displayUsername}
                </h1>
                {peer.isTalkFootBot ? (
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide',
                      L ? 'bg-violet-100 text-violet-800' : 'bg-violet-500/25 text-violet-100',
                    )}
                  >
                    Assistant
                  </span>
                ) : dm.isCloudFriend(peer.id) || (!useCloudFriends && peer.isMockFriend) ? (
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide',
                      L ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-500/20 text-emerald-100',
                    )}
                  >
                    Ami
                  </span>
                ) : null}
              </div>
              {peer.tagline ? (
                <p className={cn('text-sm font-semibold', L ? 'text-tf-grey' : 'text-sky-200/90')}>{peer.tagline}</p>
              ) : null}
              {club ? (
                <p className={cn('text-xs font-bold', L ? 'text-tf-dark/80' : 'text-sky-100/85')}>
                  Club de cœur · <span className="font-black">{club.shortName}</span> · {club.leagueName}
                </p>
              ) : (
                <p className={cn('text-xs font-semibold', L ? 'text-tf-grey' : 'text-sky-200/75')}>
                  Supporter Talk Foot
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            {canMessage ? (
              <Button type="button" variant="primary" className="min-w-[12rem] font-black" onClick={openPrivateChat}>
                Message privé
              </Button>
            ) : (
              <p
                className={cn(
                  'rounded-xl border px-4 py-3 text-xs font-semibold',
                  L
                    ? 'border-tf-dark/10 bg-white/60 text-tf-grey'
                    : 'border-white/15 bg-white/10 text-sky-200/85',
                )}
              >
                {useCloudFriends
                  ? 'Tu peux aussi lui écrire depuis la tribune en touchant sa photo de profil.'
                  : 'Les messages privés seront disponibles lorsque ce joueur sera dans tes amis.'}
              </p>
            )}

            {pendingFromThisUser ? (
              <Button
                type="button"
                variant="primary"
                disabled={friendBusy}
                className="font-black"
                onClick={() => void onAcceptFriend()}
              >
                Accepter l’invitation
              </Button>
            ) : null}

            {canAddFriend ? (
              <Button
                type="button"
                variant="soft"
                disabled={friendBusy}
                className="font-black"
                onClick={() => void onAddFriend()}
              >
                Ajouter en ami
              </Button>
            ) : null}

            <Link
              to="/match"
              className={cn(
                'rounded-xl border px-4 py-2.5 text-sm font-black transition',
                L
                  ? 'border-tf-dark/15 bg-white/90 text-tf-dark hover:bg-white'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/15',
              )}
            >
              Voir les matchs
            </Link>
          </div>

          {friendActionHint ? (
            <p className={cn('mt-4 text-center text-xs font-semibold sm:text-left', L ? 'text-emerald-700' : 'text-emerald-300')}>
              {friendActionHint}
            </p>
          ) : null}
        </div>
      </Card>

      {canViewFriendPronostics ? (
        <FriendPronosticsPanel
          displayName={displayUsername}
          bets={friendPronostics.bets}
          loading={friendPronostics.loading}
          error={friendPronostics.error}
          counts={friendPronostics.counts}
        />
      ) : null}
    </div>
  )
}
