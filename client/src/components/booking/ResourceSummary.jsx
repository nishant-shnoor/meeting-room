import { Clock, Hourglass, Sparkles, Users } from 'lucide-react'
import BuiltInChips from '../catalog/BuiltInChips'
import ResourceImage from '../assets/ResourceImage'
import { DAY_NAMES, WEEK_ORDER } from '../../utils/constants'
import { formatDuration } from '../../utils/dateTime'
import cn from '../../utils/cn'

export default function ResourceSummary({
  resource,
  hours,
  restrictions,
  embedded = false,
}) {
  const isRoom = resource.type === 'room'
  const facilities = resource.facilities
    ? resource.facilities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : []

  return (
    <aside
      className={cn(
        'overflow-hidden bg-surface',
        embedded
          ? 'rounded-xl'
          : 'h-fit rounded-2xl border border-line shadow-card',
      )}
    >
      <ResourceImage
        resource={resource}
        className="block aspect-[16/9] w-full"
      />
      <div className="p-5">
        <h2 className="text-lg font-bold text-ink">{resource.name}</h2>
        {isRoom && (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-brand-ink">
            <Users className="size-4" />
            Capacity: {resource.capacity}
          </p>
        )}
        {resource.description && (
          <p className="mt-3 text-sm text-muted">{resource.description}</p>
        )}

        {isRoom && (
          <>
            <h3 className="mt-5 flex items-center gap-2 text-sm font-bold text-ink">
              <Sparkles className="size-4 text-teal" />
              Built into this room
            </h3>
            {resource.builtIn.length ? (
              <BuiltInChips items={resource.builtIn} className="mt-2" />
            ) : (
              <p className="mt-1 text-sm text-muted">
                Nothing is built in. You can add resources while booking.
              </p>
            )}
          </>
        )}

        {facilities.length > 0 && (
          <>
            <h3 className="mt-5 text-sm font-bold text-ink">
              {isRoom ? 'Other facilities' : 'Details'}
            </h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {facilities.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-sunken px-2.5 py-1 text-xs font-medium text-ink-soft"
                >
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}

        <h3 className="mt-5 flex items-center gap-2 text-sm font-bold text-ink">
          <Clock className="size-4 text-sky" />
          Open hours
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {WEEK_ORDER.map((day) => {
            const row = hours.find((item) => item.dayOfWeek === day)
            return (
              <li key={day} className="flex justify-between">
                <span>{DAY_NAMES[day].slice(0, 3)}</span>
                <span
                  className={
                    row?.isOpen ? 'font-medium text-ink-soft' : 'text-faint'
                  }
                >
                  {row?.isOpen
                    ? `${row.openTime} - ${row.closeTime}`
                    : 'Closed'}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="mt-5 flex gap-2 rounded-xl bg-amber-soft p-3 text-xs text-amber-ink">
          <Hourglass className="mt-0.5 size-4 shrink-0" />
          <p>
            Booking length: {formatDuration(restrictions.minDurationMinutes)} to{' '}
            {formatDuration(restrictions.maxDurationMinutes)}, in{' '}
            {restrictions.slotStepMinutes} minute steps. Up to{' '}
            {restrictions.maxAdvanceDays} days ahead.
          </p>
        </div>
      </div>
    </aside>
  )
}
