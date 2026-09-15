import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { applyFrenchLiveCorrection, correctFrenchText, FR_SPELLCHECK_ATTRS } from '../../utils/frAutoCorrect'

const NO_SPELL_TYPES = new Set([
  'password',
  'email',
  'url',
  'tel',
  'number',
  'hidden',
  'date',
  'datetime-local',
  'time',
  'month',
  'week',
  'color',
  'range',
  'file',
  'checkbox',
  'radio',
])

export function Input({
  className,
  correctFrench,
  onChange,
  onBlur,
  spellCheck,
  autoCorrect,
  autoCapitalize,
  lang,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { correctFrench?: boolean }) {
  const skip = Boolean(type && NO_SPELL_TYPES.has(type))
  return (
    <input
      type={type}
      lang={lang ?? (skip ? undefined : FR_SPELLCHECK_ATTRS.lang)}
      spellCheck={spellCheck ?? (skip ? false : FR_SPELLCHECK_ATTRS.spellCheck)}
      autoCorrect={autoCorrect ?? (skip ? 'off' : FR_SPELLCHECK_ATTRS.autoCorrect)}
      autoCapitalize={autoCapitalize ?? (skip ? 'none' : FR_SPELLCHECK_ATTRS.autoCapitalize)}
      className={cn(
        'min-h-tf-touch w-full rounded-tf-xl border border-tf-dark/15 bg-white px-tf-4 py-tf-3 text-tf-md text-tf-dark outline-none placeholder:text-tf-dark/55',
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
