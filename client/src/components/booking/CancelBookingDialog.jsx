import { useState } from 'react'
import ConfirmDialog from '../ui/ConfirmDialog'
import useToast from '../../hooks/useToast'
import bookingService from '../../services/bookingService'
import { formatDate, formatTimeRange } from '../../utils/dateTime'
import getErrorMessage from '../../utils/errorMessage'

export default function CancelBookingDialog({ booking, onClose, onCancelled }) {
  const toast = useToast()
  const [cancelling, setCancelling] = useState(false)

  const handleConfirm = async () => {
    setCancelling(true)
    try {
      await bookingService.cancel(booking.id)
      toast.success('Booking cancelled')
      onCancelled()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <ConfirmDialog
      title="Cancel this booking?"
      message={`${booking.resourceName} on ${formatDate(booking.startTime)}, ${formatTimeRange(booking.startTime, booking.endTime)}. The slot becomes free for others.`}
      confirmLabel="Cancel booking"
      danger
      loading={cancelling}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  )
}
