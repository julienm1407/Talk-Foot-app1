import type { User } from '../types/chat'
import { friendDmThreadId, TALKFOOT_BOT_DM_THREAD_ID } from './directMessageConstants'
import { mockFriendUsers, talkFootBotUser } from './users'

export type DirectThread = {
  id: string
  peer: User
  lastPreview: string
  lastAtLabel: string
  unread: boolean
}

export { TALKFOOT_BOT_DM_THREAD_ID }

const friendDmThreads: DirectThread[] = mockFriendUsers
  .filter((u) => !u.isTalkFootBot)
  .map((u) => ({
    id: friendDmThreadId(u.id),
    peer: u,
    lastPreview: 'Appuie pour ouvrir la conversation privée.',
    lastAtLabel: '—',
    unread: false,
  }))

/** Fil assistant Talk Foot (seul thread conservé hors amis cloud). */
export const coachDirectThread: DirectThread = {
  id: TALKFOOT_BOT_DM_THREAD_ID,
  peer: talkFootBotUser,
  lastPreview: 'Bienvenue sur Talk Foot — je suis là pour te montrer les fonctions utiles.',
  lastAtLabel: 'À l’instant',
  unread: true,
}

/** @deprecated Ne plus utiliser en prod — amis fictifs retirés. */
export const mockDirectThreads: DirectThread[] = [coachDirectThread, ...friendDmThreads]

export type DirectMessageLine = {
  id: string
  fromMe: boolean
  body: string
  atLabel: string
}

export const mockDirectMessagesByThread: Record<string, DirectMessageLine[]> = {
  [TALKFOOT_BOT_DM_THREAD_ID]: [
    {
      id: 'bot-welcome',
      fromMe: false,
      body:
        'Salut ! Je suis ton Coach Talk Foot (assistant intégré). Tu peux m’écrire comme à un ami : paris, live, groupes, profil… Je réponds avec des repères pour explorer l’app. Quand de vrais amis rejoindront Talk Foot, ils apparaîtront ici.',
      atLabel: 'À l’instant',
    },
  ],
}
