import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

type Variant = 'primary' | 'ghost' | 'soft' | 'success'

export function Button({
  className,
  variant = 'soft',
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        'tf-btn-fluid inline-flex min-h-tf-touch items-center justify-center gap-tf-2 rounded-tf-2xl px-tf-5 py-tf-3 text-tf-md font-semibold font-display',
        TF_FOCUS_VISIBLE,
        'disabled:pointer-events-none disabled:opacity-45',
        variant === 'primary' &&
          'border-2 border-tf-cta-hover/40 bg-tf-cta text-white shadow-tf-cta transition hover:border-tf-cta-hover/50 hover:bg-tf-cta-hover hover:shadow-[0_8px_24px_rgba(255,59,59,0.28)] active:scale-[0.99]',
        variant === 'soft' &&
          'border border-tf-dark bg-white/95 text-tf-dark shadow-tf-elev-1 hover:border-tf-dark hover:bg-tf-electric-soft',
        variant === 'success' &&
          'border-2 border-emerald-500/50 bg-emerald-700 text-white shadow-tf-elev-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.28)] hover:border-emerald-400/55 hover:bg-emerald-600 active:scale-[0.99]',
        variant === 'ghost' &&
          'border-2 border-transparent bg-white/90 text-tf-dark/85 shadow-none hover:border-tf-dark/10 hover:bg-white hover:text-tf-dark',
        className,
      )}
      {...props}
    />
  )
}
