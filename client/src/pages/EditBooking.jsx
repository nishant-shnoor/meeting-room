import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import QueryState from '../components/ui/QueryState'
import EmptyState from '../components/ui/EmptyState'
import BookingForm from '../components/booking/BookingForm'
import ResourceSummary from '../components/booking/ResourceSummary'
import useFetch from '../hooks/useFetch'
import useToast from '../hooks/useToast'
import resourceService from '../services/resourceService'
import bookingService from '../services/bookingService'
import { canModifyBooking } from '../utils/booking'
import { toDateValue, toTimeValue } from '../utils/dateTime'

export default function EditBooking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const loadBooking = useCallback(async () => {
    const booking = await bookingService.get(id)
    const setup = await resourceService.getBookingSetup(booking.resourceId)

    return { booking, ...setup }
  }, [id])

  const { data, loading, error, reload } = useFetch(loadBooking)

  const handleSubmit = async (payload) => {
    await bookingService.update(id, payload)
    toast.success('Booking updated')
    navigate(-1)
  }

  return (
    <>
      <PageHeader title="Edit booking" />
      <QueryState loading={loading} error={error} onRetry={reload}>
        {data && !canModifyBooking(data.booking) && (
          <EmptyState
            icon={Lock}
            title="This booking cannot be edited"
            text="Only confirmed bookings that have not started can be changed."
          />
        )}
        {data && canModifyBooking(data.booking) && (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <ResourceSummary
              resource={data.resource}
              hours={data.hours}
              restrictions={data.restrictions}
            />
            <BookingForm
              resource={data.resource}
              hours={data.hours}
              restrictions={data.restrictions}
              ignoreBookingId={data.booking.id}
              initialValues={{
                date: toDateValue(new Date(data.booking.startTime)),
                startTime: toTimeValue(new Date(data.booking.startTime)),
                endTime: toTimeValue(new Date(data.booking.endTime)),
                purpose: data.booking.purpose ?? '',
              }}
              submitLabel="Save changes"
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </QueryState>
    </>
  )
}
