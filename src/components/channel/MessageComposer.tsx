import { useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { GifPicker } from '../chat/GifPicker'
import { EmotePicker } from '../chat/EmotePicker'
import { cn } from '../../utils/cn'

export function MessageComposer({
  onSend,
  onSendGif,
  onSendEmote,
  tokens = 0,
  unlockedEmoteIds = [],
  onUnlockEmote,
  placeholder = 'Écrire un message…',
}: {
  onSend: (text: string) => void
  onSendGif?: (url: string) => void
  onSendEmote?: (emoteId: string) => void
  tokens?: number
  unlockedEmoteIds?: string[]
  onUnlockEmote?: (emoteId: string, cost: number) => boolean
  placeholder?: string
}) {
  const [text, setText] = useState('')
  const [showGif, setShowGif] = useState(false)
  const [showEmote, setShowEmote] = useState(false)
  const canSend = useMemo(() => text.trim().length > 0, [text])
  const hasExtras = Boolean(onSendGif || onSendEmote)


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
      <form
        className="flex items-center gap-2"
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
                  'rounded-xl border px-2.5 py-2 text-lg transition focus:outline-none focus:ring-2 focus:ring-tf-grey/30',
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
                  'rounded-xl border px-2.5 py-2 text-lg transition focus:outline-none focus:ring-2 focus:ring-tf-grey/30',
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
          className="flex-1 rounded-xl border-slate-200/80 bg-white/90 py-2.5"
          aria-label="Nouveau message"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!canSend}
          className="shrink-0 rounded-xl px-5 py-2.5 font-bold"
          aria-label="Envoyer"
        >
          Envoyer
        </Button>
      </form>
    </div>
  )
}
