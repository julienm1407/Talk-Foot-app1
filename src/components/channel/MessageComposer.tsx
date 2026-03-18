import { useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function MessageComposer({
  onSend,
  placeholder = 'Écrire un message…',
}: {
  onSend: (text: string) => void
  placeholder?: string
}) {
  const [text, setText] = useState('')
  const canSend = useMemo(() => text.trim().length > 0, [text])

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSend) return
        onSend(text.trim())
        setText('')
      }}
    >
      <label className="sr-only" htmlFor="message">
        Message
      </label>
      <Input
        id="message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="flex-1"
      />
      <Button
        type="submit"
        variant="primary"
        disabled={!canSend}
        aria-label="Envoyer"
      >
        Envoyer
      </Button>
    </form>
  )
}

