import { useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import QueryState from '../components/ui/QueryState'
import BookingForm from '../components/booking/BookingForm'
import ResourceSummary from '../components/booking/ResourceSummary'
import useFetch from '../hooks/useFetch'
import useToast from '../hooks/useToast'
import resourceService from '../services/resourceService'
import bookingService from '../services/bookingService'
import { pickDefaultDuration, buildDurations } from '../utils/slots'
import { timeToMinutes, todayValue } from '../utils/dateTime'

export default function BookResource() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const loadSetup = useCallback(async () => {
    const setup = await resourceService.getBookingSetup(id)
    const equipment =
      setup.resource.type === 'room'
        ? await resourceService.listEquipment()
        : []
    return {
      ...setup,
      equipment: equipment.filter((item) => item.isActive && !item.builtInRoom),
    }
  }, [id])

  const { data, loading, error, reload } = useFetch(loadSetup)

  const handleSubmit = async (payload) => {
    await bookingService.create(payload)
    toast.success('Booking confirmed')
    navigate('/bookings')
  }

  const startParam = searchParams.get('start')

  return (
    <>
      <PageHeader title="New booking" />
      <QueryState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <ResourceSummary {...data} />
            <BookingForm
              resource={data.resource}
              restrictions={data.restrictions}
              equipment={data.equipment}
              initialValues={{
                date: searchParams.get('date') || todayValue(),
                start: startParam ? timeToMinutes(startParam) : null,
                duration: pickDefaultDuration(
                  buildDurations(data.restrictions),
                ),
                addOnIds: [],
                purpose: '',
              }}
              submitLabel="Confirm booking"
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </QueryState>
    </>
  )
}
