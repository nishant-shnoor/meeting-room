import { AlertCircle } from 'lucide-react'
import Button from './Button'

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <AlertCircle className="size-5 shrink-0" />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
