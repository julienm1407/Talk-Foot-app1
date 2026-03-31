import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'min-h-tf-touch w-full rounded-tf-xl border border-tf-dark/15 bg-white px-tf-4 py-tf-3 text-tf-md text-tf-dark outline-none placeholder:text-tf-dark/55',
        'disabled:cursor-not-allowed disabled:opacity-55',
        TF_FOCUS_VISIBLE,
        className,
      )}
      {...props}
    />
  )
}
