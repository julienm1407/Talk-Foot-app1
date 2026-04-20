import { useMemo, useState } from 'react'
import type { Message } from '../../types/chat'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { GifPicker } from '../chat/GifPicker'
import { EmotePicker } from '../chat/EmotePicker'
import { cn } from '../../utils/cn'

export type ScarfSendPayload = NonNullable<Message['groupScarf']>

export function MessageComposer({
  onSend,
  onSendGif,
  onSendEmote,
  tokens = 0,
  unlockedEmoteIds = [],
  onUnlockEmote,
  placeholder = 'Écrire un message…',
  /** Zone Chill live : texte uniquement (pas GIF / emotes). */
  richMedia = true,
  /** Emotes rapides (salons groupe / perso). */
  quickEmotes,
  onQuickEmote,
  /** Écharpes des groupes rejoints — envoi dans le chat. */
  scarfChoices,
  onSendScarf,
}: {
  onSend: (text: string) => void
  onSendGif?: (url: string) => void
  onSendEmote?: (emoteId: string) => void
  tokens?: number
  unlockedEmoteIds?: string[]
  onUnlockEmote?: (emoteId: string, cost: number) => boolean
  placeholder?: string
  richMedia?: boolean
  quickEmotes?: string[]
  onQuickEmote?: (emoji: string) => void
  scarfChoices?: ScarfSendPayload[]
  onSendScarf?: (payload: ScarfSendPayload) => void
}) {
  const [text, setText] = useState('')
  const [showGif, setShowGif] = useState(false)
  const [showEmote, setShowEmote] = useState(false)
  const [scarfOpen, setScarfOpen] = useState(false)
  const canSend = useMemo(() => text.trim().length > 0, [text])
  const hasExtras = richMedia && Boolean(onSendGif || onSendEmote)
  const showQuickRow = Boolean(
    (quickEmotes && quickEmotes.length > 0 && onQuickEmote) ||
      (scarfChoices && scarfChoices.length > 0 && onSendScarf),
  )

  return (
    <div className="relative">
      {(showGif || showEmote) && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden="true"
          onClick={() => {
            setShowGif(false)
            setShowEmote(false)
          }}
        />
      )}
      {showGif && onSendGif && (
        <GifPicker
          onSelect={(url) => {
            onSendGif(url)
            setShowGif(false)
          }}
          onClose={() => setShowGif(false)}
          className="z-50"
        />
      )}
      {showEmote && onSendEmote && (
        <EmotePicker
          unlockedIds={unlockedEmoteIds}
          tokens={tokens}
          onSelect={(id) => onSendEmote(id)}
          onUnlock={(emoteId, cost) => onUnlockEmote?.(emoteId, cost) ?? false}
          onClose={() => setShowEmote(false)}
          className="z-50"
        />
      )}
      {showQuickRow ? (
        <div className="-mx-0.5 mb-1.5 flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden py-0.5 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:mb-2 sm:flex-wrap sm:gap-1.5 sm:overflow-visible">
          {quickEmotes?.map((em) => (
            <button
              key={em}
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200/80 bg-white/90 text-base shadow-sm transition hover:border-tf-electric/35 hover:bg-slate-50 sm:size-9 sm:rounded-xl sm:text-lg"
              onClick={() => onQuickEmote?.(em)}
              aria-label={`Envoyer ${em}`}
            >
              {em}
            </button>
          ))}
          {scarfChoices && scarfChoices.length > 0 && onSendScarf ? (
            <div className="relative shrink-0">
              <button
                type="button"
                className="rounded-xl border border-violet-200 bg-violet-50/90 px-2.5 py-1.5 text-[11px] font-black text-violet-950 shadow-sm transition hover:bg-violet-100"
                aria-expanded={scarfOpen}
                aria-haspopup="listbox"
                onClick={() => setScarfOpen((v) => !v)}
              >
                🧣 Écharpe
              </button>
              {scarfOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-30 cursor-default"
                    aria-label="Fermer"
                    onClick={() => setScarfOpen(false)}
                  />
                  <ul
                    className="absolute bottom-full left-0 z-40 mb-1 max-h-48 min-w-[12rem] overflow-y-auto rounded-xl border border-violet-200/80 bg-white py-1 shadow-lg"
                    role="listbox"
                  >
                    {scarfChoices.map((s) => (
                      <li key={s.groupId} role="option">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-violet-50"
                          onClick={() => {
                            onSendScarf(s)
                            setScarfOpen(false)
                          }}
                        >
                          <span
                            className="inline-flex h-6 w-10 overflow-hidden rounded border border-slate-200"
                            aria-hidden
                          >
                            <span className="h-full w-1/3" style={{ background: s.colorA }} />
                            <span className="h-full w-1/3" style={{ background: s.colorB }} />
                            <span className="h-full w-1/3" style={{ background: s.colorC }} />
                          </span>
                          <span className="min-w-0 truncate">{s.groupName}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <form
        className="flex items-center gap-1.5 sm:gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSend) return
          onSend(text.trim())
          setText('')
        }}
      >
        {hasExtras && (
          <div className="flex shrink-0 gap-1">
            {onSendGif && (
              <button
                type="button"
                onClick={() => {
                  setShowEmote(false)
                  setShowGif((v) => !v)
                }}
                className={cn(
                  'tf-interactive-press rounded-lg border px-2 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-tf-grey/30 sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-lg',
                  showGif
                    ? 'border-tf-grey/50 bg-tf-grey-pastel/30'
                    : 'border-slate-200/70 bg-white/80 hover:bg-slate-50',
                )}
                aria-label="Envoyer un GIF"
                title="GIF"
              >
                🎬
              </button>
            )}
            {onSendEmote && (
              <button
                type="button"
                onClick={() => {
                  setShowGif(false)
                  setShowEmote((v) => !v)
                }}
                className={cn(
                  'tf-interactive-press rounded-lg border px-2 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-tf-grey/30 sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-lg',
                  showEmote
                    ? 'border-tf-grey/50 bg-tf-grey-pastel/30'
                    : 'border-slate-200/70 bg-white/80 hover:bg-slate-50',
                )}
                aria-label="Envoyer un emote"
                title="Emotes (crédits)"
              >
                😀
              </button>
            )}
          </div>
        )}
        <label className="sr-only" htmlFor="message">
          Message
        </label>
        <Input
          id="message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 rounded-lg border-slate-200/80 bg-white/90 py-2 text-sm sm:rounded-xl sm:py-2.5 sm:text-base"
          aria-label="Nouveau message"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!canSend}
          className="shrink-0 rounded-lg px-3 py-2 text-sm font-bold sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-base"
          aria-label="Envoyer"
        >
          Envoyer
        </Button>
      </form>
    </div>
  )
}
