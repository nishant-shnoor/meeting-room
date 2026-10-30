import { Check } from 'lucide-react'
import { resourceIconFor } from '../../utils/assets'
import { addOnProblem } from '../../utils/slots'
import cn from '../../utils/cn'

export default function AddOnPicker({
  candidates,
  selectedIds,
  onToggle,
  dataById,
  slot,
}) {
  if (!candidates.length) {
    return (
      <p className="rounded-xl bg-sunken p-3 text-sm text-muted">
        No other resources are available to add right now.
      </p>
    )
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {candidates.map((item) => {
        const Icon = resourceIconFor(item)
        const selected = selectedIds.includes(item.id)
        const entry = dataById.get(item.id)
        const problem = entry
          ? addOnProblem(
              entry,
              slot?.point,
              slot?.start ?? entry.openMinutes,
              slot ? slot.end : entry.openMinutes + 1,
            )
          : null
        const blocked = Boolean(problem) && !selected
        const dayClosed = entry && (!entry.isOpen || entry.unavailableReason)

        return (
          <li key={item.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={selected}
              disabled={blocked}
              onClick={() => onToggle(item.id)}
              title={problem ?? undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed',
                selected
                  ? 'border-teal bg-teal-soft text-teal-ink'
                  : 'border-line bg-surface text-ink-soft hover:bg-subtle',
                blocked && 'opacity-60',
              )}
            >
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-lg',
                  selected
                    ? 'bg-teal text-white dark:text-[#0b0e1c]'
                    : 'bg-sunken text-muted',
                )}
              >
                <Icon className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {item.name}
                </span>
                <span className="block truncate text-xs text-muted">
                  {blocked
                    ? dayClosed
                      ? 'Not available on this day'
                      : 'Busy at your chosen time'
                    : selected
                      ? 'Added to this booking'
                      : 'Free to add'}
                </span>
              </span>
              {selected && <Check className="size-4 shrink-0" />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
