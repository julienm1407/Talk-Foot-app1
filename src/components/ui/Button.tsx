import { cn } from '../../utils/cn'

type Variant = 'primary' | 'ghost' | 'soft'

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
        'tf-btn-fluid inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold font-display outline-none',
        'focus-visible:ring-2 focus-visible:ring-tf-electric/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        'disabled:pointer-events-none disabled:opacity-45',
        variant === 'primary' &&
          'border-2 border-sky-800/25 bg-gradient-to-b from-sky-500 to-blue-700 text-white shadow-[0_8px_24px_rgba(14,165,233,0.35)] [text-shadow:0_1px_1px_rgba(0,0,0,0.22)] hover:from-sky-400 hover:to-blue-600',
        variant === 'soft' &&
          'border-2 border-tf-dark/14 bg-white text-tf-dark shadow-[0_2px_10px_rgba(1,30,51,0.06)] hover:border-tf-electric/40 hover:bg-tf-ice',
        variant === 'ghost' &&
          'border-2 border-transparent bg-white/90 text-tf-dark/85 shadow-none hover:border-tf-dark/10 hover:bg-white hover:text-tf-dark',
        className,
      )}
      {...props}
    />
  )
}

