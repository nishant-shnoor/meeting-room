import Modal from '../ui/Modal'
import StatusBadge from '../ui/StatusBadge'
import { getDisplayStatus } from '../../utils/booking'
import { formatLongDate, formatTimeRange } from '../../utils/dateTime'

export default function BookingDetailsModal({ booking, onClose }) {
  const rows = [
    ['Resource', booking.resourceName],
    ['Date', formatLongDate(booking.startTime)],
    ['Time', formatTimeRange(booking.startTime, booking.endTime)],
    booking.userName && ['Booked by', booking.userName],
    [...(booking.builtIn ?? []), ...(booking.addOns ?? [])].length > 0 && [
      'Includes',
      [...(booking.builtIn ?? []), ...(booking.addOns ?? [])]
        .map((item) => item.name)
        .join(', '),
    ],
    booking.purpose && ['Purpose', booking.purpose],
  ].filter(Boolean)

  return (
    <Modal title="Booking details" onClose={onClose}>
      <dl className="space-y-2 text-sm">
        {rows.map(([term, detail]) => (
          <div key={term} className="flex justify-between gap-4">
            <dt className="text-muted">{term}</dt>
            <dd className="text-right font-medium text-ink">{detail}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Status</dt>
          <dd>
            <StatusBadge status={getDisplayStatus(booking)} />
          </dd>
        </div>
      </dl>
    </Modal>
  )
}
