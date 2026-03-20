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
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold font-display outline-none transition',
        'focus-visible:ring-2 focus-visible:ring-tf-electric/40',
        variant === 'primary' &&
          'bg-tf-dark text-tf-white shadow-sm hover:bg-tf-dark-alt',
        variant === 'soft' &&
          'border border-tf-grey-pastel/60 bg-white/95 text-[#011e33] hover:border-tf-electric/25 hover:bg-tf-ice/80',
        variant === 'ghost' &&
          'text-tf-grey hover:bg-tf-grey-pastel/35 hover:text-tf-dark',
        className,
      )}
      {...props}
    />
  )
}

