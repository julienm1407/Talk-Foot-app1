import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useDirectMessagesContext } from '../../contexts/DirectMessagesContext'
import { usePrivateMessagesUi } from '../../contexts/PrivateMessagesUiContext'
import { friendDmThreadId } from '../../data/directMessageConstants'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { useModalBackdropGuard } from '../../utils/modalBackdropGuard'

export type ChatPeerQuickMenuTarget = {
  id: string
  username: string
  avatarSeed?: string
  accent?: string
}

export function ChatPeerQuickMenu({
  open,
  onClose,
  peer,
  dark = false,
}: {
  open: boolean
  onClose: () => void
  peer: ChatPeerQuickMenuTarget | null
  dark?: boolean
}) {
  const pm = usePrivateMessagesUi()
  const dm = useDirectMessagesContext()
  const [hint, setHint] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { shouldIgnoreBackdropClose, backdropPointerEvents } = useModalBackdropGuard(open)

  useEffect(() => {
    if (!open) return
    setHint(null)
    setBusy(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !peer) return null

  const portalTarget = getModalPortalRoot()
  if (!portalTarget) return null

  const isFriend = dm.isCloudFriend(peer.id)
  const outgoing = dm.hasOutgoingFriendRequestTo(peer.id)
  const incoming = dm.hasIncomingFriendRequestFrom(peer.id)

  const openPrivateChat = () => {
    dm.registerPeerForPrivateChat(peer)
    pm.open({ threadId: friendDmThreadId(peer.id) })
    onClose()
  }

  const onAddFriend = async () => {
    setHint(null)
    setBusy(true)
    const out = await dm.sendFriendRequest(peer.id)
    setBusy(false)
    if (out.ok) setHint('Demande envoyée — enregistrée sur ton compte.')
    else if (out.error === 'already_exists') setHint('Une demande existe déjà entre vous.')
    else setHint(out.error ?? 'Impossible d’envoyer la demande.')
  }

  const onAcceptFriend = async () => {
    setHint(null)
    setBusy(true)
    const out = await dm.acceptFriendRequest(peer.id)
    setBusy(false)
    if (out.ok) setHint('Vous êtes amis — retrouve la conversation dans Messages.')
    else setHint(out.error ?? 'Impossible d’accepter.')
  }

  const shell = dark
    ? 'border-slate-600/50 bg-[#0d2135] text-slate-50 shadow-2xl'
    : 'border-tf-dark/12 bg-white text-tf-dark shadow-xl'
  const muted = dark ? 'text-sky-200/80' : 'text-tf-grey'
  const btn = cn(
    'w-full rounded-xl border px-4 py-3 text-left text-sm font-black transition',
    TF_FOCUS_VISIBLE,
    dark
      ? 'border-slate-500/40 bg-[#112a42] text-slate-50 hover:bg-[#163452]'
      : 'border-tf-dark/10 bg-tf-grey-pastel/25 text-tf-dark hover:bg-tf-grey-pastel/45',
  )

  return createPortal(
    <div
      className={cn(
        'pointer-events-auto fixed inset-0 z-[2] grid w-full touch-manipulation place-items-end sm:place-items-center',
        'h-[100dvh] max-h-[100dvh]',
        'p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]',
      )}
      data-tf-modal="true"
      role="dialog"
      aria-modal="true"
      aria-label={`Actions pour ${peer.username}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        style={{ pointerEvents: backdropPointerEvents }}
        onClick={() => {
          if (shouldIgnoreBackdropClose()) return
          onClose()
        }}
        aria-label="Fermer"
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-[min(100%,24rem)] overflow-hidden rounded-2xl',
          'max-h-[min(calc(100dvh-1.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)),32rem)]',
          shell,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('border-b px-4 py-3', dark ? 'border-slate-600/40' : 'border-tf-dark/10')}>
          <p className="text-base font-black">{peer.username}</p>
          <p className={cn('mt-0.5 text-xs font-semibold', muted)}>Message privé ou demande d’ami</p>
        </div>

        <div className="max-h-[min(22rem,60dvh)] overflow-y-auto overscroll-y-contain p-4">
          <div className="flex flex-col gap-2">
            <button type="button" className={btn} onClick={openPrivateChat}>
              Message privé
            </button>

            {incoming ? (
              <button type="button" className={btn} disabled={busy} onClick={() => void onAcceptFriend()}>
                Accepter la demande d’ami
              </button>
            ) : isFriend ? (
              <p className={cn('px-1 text-xs font-semibold', muted)}>Déjà dans tes amis.</p>
            ) : outgoing ? (
              <p className={cn('px-1 text-xs font-semibold', muted)}>Demande d’ami en attente.</p>
            ) : (
              <button type="button" className={btn} disabled={busy} onClick={() => void onAddFriend()}>
                Demander en ami
              </button>
            )}

            <Link
              to={`/user/${peer.id}`}
              state={{ username: peer.username }}
              className={cn(btn, 'inline-block text-center no-underline')}
              onClick={onClose}
            >
              Voir le profil
            </Link>

            {hint ? <p className={cn('text-xs font-semibold', muted)}>{hint}</p> : null}

            <button
              type="button"
              onClick={onClose}
              className={cn(
                'mt-1 w-full rounded-xl py-2.5 text-xs font-black',
                TF_FOCUS_VISIBLE,
                dark ? 'text-sky-200 hover:text-white' : 'text-sky-700 hover:text-sky-800',
              )}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  )
}
