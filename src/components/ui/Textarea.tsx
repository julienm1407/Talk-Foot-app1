import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { applyFrenchLiveCorrection, correctFrenchText, FR_SPELLCHECK_ATTRS } from '../../utils/frAutoCorrect'

export function Textarea({
  className,
  correctFrench,
  onChange,
  onBlur,
  spellCheck,
  autoCorrect,
  autoCapitalize,
  lang,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { correctFrench?: boolean }) {
  return (
    <textarea
      lang={lang ?? FR_SPELLCHECK_ATTRS.lang}
      spellCheck={spellCheck ?? FR_SPELLCHECK_ATTRS.spellCheck}
      autoCorrect={autoCorrect ?? FR_SPELLCHECK_ATTRS.autoCorrect}
      autoCapitalize={autoCapitalize ?? FR_SPELLCHECK_ATTRS.autoCapitalize}
      className={cn(
        'min-h-[5.5rem] w-full rounded-tf-xl border border-tf-dark/15 bg-white px-tf-4 py-tf-3 text-tf-md text-tf-dark outline-none placeholder:text-tf-dark/55',
        'disabled:cursor-not-allowed disabled:opacity-55',
        TF_FOCUS_VISIBLE,
        className,
      )}
      {...props}
      onChange={(e) => {
        if (correctFrench) applyFrenchLiveCorrection(e.target, e.nativeEvent)
        onChange?.(e)
      }}
      onBlur={(e) => {
        if (correctFrench) {
          const next = correctFrenchText(e.target.value)
          if (next !== e.target.value) {
            e.target.value = next
            onChange?.(e)
          }
        }
        onBlur?.(e)
      }}
    />
  )
}
