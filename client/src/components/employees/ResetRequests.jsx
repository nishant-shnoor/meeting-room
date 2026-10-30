import { KeyRound, X } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { formatDate, formatTime } from '../../utils/dateTime'

export default function ResetRequests({ requests, onReset, onDismiss }) {
  if (!requests.length) return null

  return (
    <section
      className="mb-6 rounded-2xl border border-amber bg-amber-soft p-4 text-amber-ink"
      aria-label="Password reset requests"
    >
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <KeyRound className="size-4" />
        Password reset requests ({requests.length})
      </h2>
      <ul className="mt-3 space-y-2">
        {requests.map((request) => (
          <li
            key={request.id}
            className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-3 text-ink"
          >
            <Avatar name={request.name} className="size-9 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{request.name}</p>
              <p className="truncate text-xs text-muted">
                {request.email} - asked on {formatDate(request.createdAt)} at{' '}
                {formatTime(request.createdAt)}
              </p>
            </div>
            <Button onClick={() => onReset(request)}>Set new password</Button>
            <Button
              variant="secondary"
              aria-label={`Dismiss request from ${request.name}`}
              onClick={() => onDismiss(request)}
            >
              <X className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
