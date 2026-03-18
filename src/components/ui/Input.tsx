import { cn } from '../../utils/cn'

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400',
        'focus:border-blue-600/30 focus:ring-2 focus:ring-blue-600/15',
        className,
      )}
      {...props}
    />
  )
}

