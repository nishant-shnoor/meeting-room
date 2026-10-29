import { useCallback, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Info } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import QueryState from '../components/ui/QueryState'
import EmptyState from '../components/ui/EmptyState'
import TextField from '../components/ui/TextField'
import BookedTimeline from '../components/booking/BookedTimeline'
import ResourceSummary from '../components/booking/ResourceSummary'
import useFetch from '../hooks/useFetch'
import resourceService from '../services/resourceService'
import bookingService from '../services/bookingService'
import { getFreeSlots } from '../utils/availability'
import buttonClass from '../utils/buttonStyles'
import {
  addDays,
  combineDateTime,
  timeToMinutes,
  todayValue,
} from '../utils/dateTime'

export default function ResourceDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [date, setDate] = useState(searchParams.get('date') || todayValue())

  const loadSetup = useCallback(() => resourceService.getBookingSetup(id), [id])
  const { data: setup, loading, error, reload } = useFetch(loadSetup)

  const loadDayBookings = useCallback(() => {
    if (!date) {
      return Promise.resolve([])
    }

    const dayStart = combineDateTime(date, '00:00')

    return bookingService.listInRange({
      from: dayStart.toISOString(),
      to: addDays(dayStart, 1).toISOString(),
      resourceId: id,
    })
  }, [date, id])

  const { data: dayBookings } = useFetch(loadDayBookings)

  const dayHours = useMemo(() => {
    if (!setup || !date) {
      return null
    }

    const day = combineDateTime(date, '00:00').getDay()

    return setup.hours.find((row) => row.dayOfWeek === day) ?? null
  }, [setup, date])

  const freeSlots = useMemo(() => {
    if (!setup || !dayBookings) {
      return []
    }

    return getFreeSlots(date, setup.hours, setup.restrictions, dayBookings)
  }, [setup, dayBookings, date])

  const isOpen = Boolean(dayHours?.isOpen)
  const timelineStart = isOpen
    ? Math.floor(timeToMinutes(dayHours.openTime) / 60)
    : 8
  const timelineEnd = isOpen
    ? Math.ceil(timeToMinutes(dayHours.closeTime) / 60)
    : 20

  return (
    <>
      <PageHeader
        title={setup ? setup.resource.name : 'Resource'}
        subtitle="Check availability before booking"
      >
        <Link to="/resources" className={buttonClass('secondary')}>
          <ArrowLeft className="size-4" />
          All resources
        </Link>
      </PageHeader>

      <QueryState loading={loading} error={error} onRetry={reload}>
        {setup && (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <ResourceSummary {...setup} />

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <TextField
                  label="Date"
                  type="date"
                  min={todayValue()}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />

                <Link
                  to={`/resources/${id}/book?date=${date}`}
                  className={buttonClass('primary')}
                >
                  Book this resource
                </Link>
              </div>

              <h3 className="mb-2 mt-6 text-sm font-semibold text-gray-900">
                Booked on this day
              </h3>
              <BookedTimeline
                bookings={dayBookings ?? []}
                startHour={timelineStart}
                endHour={timelineEnd}
              />

              <h3 className="mb-2 mt-6 text-sm font-semibold text-gray-900">
                Free slots
              </h3>

              {!isOpen && (
                <p className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Info className="size-4" />
                  This resource is closed on the selected day.
                </p>
              )}

              {isOpen && freeSlots.length === 0 && (
                <EmptyState
                  title="No free slots"
                  text="Everything is taken or already in the past. Try another day."
                />
              )}

              {freeSlots.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {freeSlots.map((slot) => (
                    <li key={slot.startTime}>
                      <Link
                        to={`/resources/${id}/book?date=${date}&start=${slot.startTime}`}
                        className="block rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100"
                      >
                        {slot.startTime} - {slot.endTime}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </QueryState>
    </>
  )
}
