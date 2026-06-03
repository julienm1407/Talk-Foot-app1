import { useCallback, useState } from 'react'
import type { ChatPeerQuickMenuTarget } from '../components/chat/ChatPeerQuickMenu'

export function useChatPeerMenu() {
  const [peerMenu, setPeerMenu] = useState<ChatPeerQuickMenuTarget | null>(null)

  const openPeerMenu = useCallback((target: ChatPeerQuickMenuTarget) => {
    setPeerMenu(target)
  }, [])

  const closePeerMenu = useCallback(() => {
    setPeerMenu(null)
  }, [])

  return {
    peerMenu,
    openPeerMenu,
    closePeerMenu,
    menuOpen: peerMenu != null,
  }
}
