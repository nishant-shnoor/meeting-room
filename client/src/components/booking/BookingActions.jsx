import { Link } from 'react-router-dom'
import { Pencil, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import buttonClass from '../../utils/buttonStyles'
import { canModifyBooking } from '../../utils/booking'

export default function BookingActions({ booking, onCancel }) {
  if (!canModifyBooking(booking)) {
    return <span className="text-gray-400">-</span>
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        to={`/bookings/${booking.id}/edit`}
        className={buttonClass('ghost', 'px-2 py-1')}
      >
        <Pencil className="size-4" />
        Edit
      </Link>
      <Button
        variant="ghostDanger"
        className="px-2 py-1"
        onClick={() => onCancel(booking)}
      >
        <XCircle className="size-4" />
        Cancel
      </Button>
    </div>
  )
}
