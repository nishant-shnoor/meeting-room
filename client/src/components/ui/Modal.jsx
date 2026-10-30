import { useEffect } from 'react'
import { X } from 'lucide-react'
import cn from '../../utils/cn'

export default function Modal({
  title,
  onClose,
  wide = false,
  size,
  children,
}) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const width =
    size === 'xl' ? 'sm:max-w-3xl' : wide ? 'sm:max-w-lg' : 'sm:max-w-md'

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#0b0e1c]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          'max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-2xl ring-1 ring-line sm:rounded-2xl',
          width,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
