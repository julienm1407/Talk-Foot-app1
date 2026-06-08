import type { MouseEvent } from 'react'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'

type LeaveTribuneButtonProps = {
  groupName: string
  onLeave: () => void
  /** `card` : pleine largeur sous une carte ; `inline` : compact à côté d’actions */
  layout?: 'card' | 'inline'
  className?: string
  disabled?: boolean
  busy?: boolean
}

export function LeaveTribuneButton({
  groupName,
  onLeave,
  layout = 'card',
  className,
  disabled,
  busy,
}: LeaveTribuneButtonProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled || busy) return
    const ok = window.confirm(
      `Quitter la tribune « ${groupName} » ?\n\nTu libéreras une place pour en rejoindre une autre.`,
    )
    if (!ok) return
    onLeave()
  }

  return (
    <Button
      type="button"
      variant="soft"
      disabled={disabled || busy}
      aria-busy={busy}
      className={cn(
        'touch-manipulation border-2 border-rose-300/70 bg-rose-50 text-rose-900 shadow-sm',
        'hover:border-rose-400/80 hover:bg-rose-100 hover:text-rose-950',
        layout === 'card'
          ? 'min-h-12 w-full rounded-2xl text-sm font-black'
          : 'min-h-11 rounded-2xl px-4 text-xs font-black',
        className,
      )}
      onClick={handleClick}
    >
      {busy ? '…' : '🚪 Quitter la tribune'}
    </Button>
  )
}
