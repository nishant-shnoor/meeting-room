import BookingActions from './BookingActions'
import StatusBadge from '../ui/StatusBadge'
import { getDisplayStatus } from '../../utils/booking'
import { formatDate, formatTimeRange } from '../../utils/dateTime'

function AddOnChips({ booking }) {
  if (!booking.addOns?.length) return null

  return (
    <ul className="mt-1 flex flex-wrap gap-1">
      {booking.addOns.map((item) => (
        <li
          key={item.resourceId}
          className="rounded-full bg-teal-soft px-2 py-0.5 text-xs font-medium text-teal-ink"
        >
          + {item.name}
        </li>
      ))}
    </ul>
  )
}

export default function BookingsTable({
  bookings,
  showUser = false,
  onCancel,
}) {
  const headings = [
    showUser && 'User',
    'Resource',
    'Date',
    'Time',
    'Status',
    'Actions',
  ].filter(Boolean)

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-card md:block">
        <table className="w-full text-left text-sm text-ink-soft">
          <thead className="bg-sunken text-ink">
            <tr>
              {headings.map((heading) => (
                <th key={heading} className="px-4 py-3 font-bold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                {showUser && <td className="px-4 py-3">{booking.userName}</td>}
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">
                    {booking.resourceName}
                  </p>
                  <AddOnChips booking={booking} />
                </td>
                <td className="px-4 py-3">{formatDate(booking.startTime)}</td>
                <td className="px-4 py-3">
                  {formatTimeRange(booking.startTime, booking.endTime)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={getDisplayStatus(booking)} />
                </td>
                <td className="px-4 py-3">
                  <BookingActions booking={booking} onCancel={onCancel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {bookings.map((booking) => (
          <li
            key={booking.id}
            className="rounded-2xl border border-line bg-surface p-4 text-sm shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-ink">{booking.resourceName}</p>
              <StatusBadge status={getDisplayStatus(booking)} />
            </div>
            <AddOnChips booking={booking} />
            {showUser && <p className="mt-1 text-muted">{booking.userName}</p>}
            <p className="mt-1 text-muted">
              {formatDate(booking.startTime)},{' '}
              {formatTimeRange(booking.startTime, booking.endTime)}
            </p>
            <div className="mt-3">
              <BookingActions booking={booking} onCancel={onCancel} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
