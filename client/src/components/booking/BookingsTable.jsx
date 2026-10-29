import BookingActions from './BookingActions'
import StatusBadge from '../ui/StatusBadge'
import { getDisplayStatus } from '../../utils/booking'
import { formatDate, formatTimeRange } from '../../utils/dateTime'

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
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              {headings.map((heading) => (
                <th key={heading} className="px-4 py-3 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                {showUser && <td className="px-4 py-3">{booking.userName}</td>}
                <td className="px-4 py-3 font-medium text-gray-900">
                  {booking.resourceName}
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
            className="rounded-lg border border-gray-200 bg-white p-4 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-gray-900">
                {booking.resourceName}
              </p>
              <StatusBadge status={getDisplayStatus(booking)} />
            </div>
            {showUser && (
              <p className="mt-1 text-gray-600">{booking.userName}</p>
            )}
            <p className="mt-1 text-gray-600">
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
