import { DoorOpen, Projector, Users } from 'lucide-react'
import { DAY_NAMES, WEEK_ORDER } from '../../utils/constants'

export default function ResourceSummary({ resource, hours, restrictions }) {
  const isRoom = resource.type === 'room'
  const Icon = isRoom ? DoorOpen : Projector
  const facilities = resource.facilities
    ? resource.facilities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : []

  return (
    <aside className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex h-32 items-center justify-center rounded-md bg-gray-100 text-gray-400">
        <Icon className="size-12" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{resource.name}</h2>
      {isRoom && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
          <Users className="size-4" />
          Capacity: {resource.capacity}
        </p>
      )}
      {resource.description && (
        <p className="mt-3 text-sm text-gray-600">{resource.description}</p>
      )}

      {facilities.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-semibold text-gray-900">
            Facilities
          </h3>
          <ul className="mt-1 list-inside list-disc text-sm text-gray-600">
            {facilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}

      <h3 className="mt-5 text-sm font-semibold text-gray-900">Open hours</h3>
      <ul className="mt-1 space-y-0.5 text-sm text-gray-600">
        {WEEK_ORDER.map((day) => {
          const row = hours.find((item) => item.dayOfWeek === day)

          return (
            <li key={day} className="flex justify-between">
              <span>{DAY_NAMES[day].slice(0, 3)}</span>
              <span>
                {row?.isOpen ? `${row.openTime} - ${row.closeTime}` : 'Closed'}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-5 text-xs text-gray-500">
        Booking length: {restrictions.minDurationMinutes} to{' '}
        {restrictions.maxDurationMinutes} minutes. Up to{' '}
        {restrictions.maxAdvanceDays} days ahead.
      </p>
    </aside>
  )
}
