import { ChatPeerQuickMenu } from './ChatPeerQuickMenu'
import type { ChatPeerQuickMenuTarget } from './ChatPeerQuickMenu'

export function ChatPeerMenuHost({
  peerMenu,
  menuOpen,
  onClose,
  dark = false,
}: {
  peerMenu: ChatPeerQuickMenuTarget | null
  menuOpen: boolean
  onClose: () => void
  dark?: boolean
}) {
  return (
    <ChatPeerQuickMenu open={menuOpen} peer={peerMenu} dark={dark} onClose={onClose} />
  )
}
