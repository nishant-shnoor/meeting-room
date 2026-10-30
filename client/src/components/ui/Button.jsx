import { Loader2 } from 'lucide-react'
import buttonClass from '../../utils/buttonStyles'

export default function Button({
  variant,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClass(variant, className)}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
