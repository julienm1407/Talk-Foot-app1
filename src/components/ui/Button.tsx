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
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold outline-none transition',
        'focus-visible:ring-2 focus-visible:ring-blue-600/25',
        variant === 'primary' &&
          'bg-[#0b1b3a] text-white hover:bg-[#102a56]',
        variant === 'soft' &&
          'border border-slate-200 bg-white/80 text-slate-900 hover:bg-white',
        variant === 'ghost' &&
          'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        className,
      )}
      {...props}
    />
  )
}

