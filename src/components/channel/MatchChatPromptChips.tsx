import type { MatchChatPromptDef } from '../../utils/matchChatPrompts'
import { cn } from '../../utils/cn'

export function MatchChatPromptChips({
  prompts,
  light,
  onPick,
}: {
  prompts: readonly MatchChatPromptDef[]
  light: boolean
  onPick: (id: MatchChatPromptDef['id']) => void
}) {
  if (prompts.length === 0) return null
  return (
    <div
      className="shrink-0 overflow-x-auto overflow-y-hidden pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Suggestions du salon"
    >
      <div className="flex w-max min-w-full flex-nowrap gap-1.5">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            role="listitem"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onPick(prompt.id)
            }}
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black leading-none',
              light
                ? 'border-tf-cta/50 bg-tf-cta/10 text-tf-cta'
                : 'border-tf-cta/55 bg-tf-cta/20 text-white',
            )}
          >
            <span aria-hidden>{prompt.icon}</span>
            <span>{prompt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
