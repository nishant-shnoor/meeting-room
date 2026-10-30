import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CalendarToolbar from '../components/calendar/CalendarToolbar'
import DayView from '../components/calendar/DayView'
import WeekView from '../components/calendar/WeekView'
import MonthView from '../components/calendar/MonthView'
import BookingDetailsModal from '../components/calendar/BookingDetailsModal'
import PageHeader from '../components/ui/PageHeader'
import ErrorMessage from '../components/ui/ErrorMessage'
import PageLoader from '../components/ui/PageLoader'
import useFetch from '../hooks/useFetch'
import resourceService from '../services/resourceService'
import bookingService from '../services/bookingService'
import { bookPath } from '../utils/paths'
import { BOOKING_STATUS } from '../utils/constants'
import {
  addDays,
  addMonths,
  formatLongDate,
  formatMonth,
  getMonthGrid,
  minutesToTime,
  startOfDay,
  startOfWeek,
  toDateValue,
} from '../utils/dateTime'

const getRange = (view, cursor) => {
  if (view === 'day') return { from: cursor, to: addDays(cursor, 1) }
  if (view === 'week') {
    const from = startOfWeek(cursor)
    return { from, to: addDays(from, 7) }
  }
  const grid = getMonthGrid(cursor)
  return { from: grid[0], to: addDays(grid[grid.length - 1], 1) }
}

const getLabel = (view, cursor) => {
  if (view === 'day') return formatLongDate(cursor)
  if (view === 'month') return formatMonth(cursor)
  const weekStart = startOfWeek(cursor)
  const weekEnd = addDays(weekStart, 6)
  return `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${formatLongDate(weekEnd)}`
}

const shiftCursor = (view, cursor, direction) => {
  if (view === 'day') return addDays(cursor, direction)
  if (view === 'week') return addDays(cursor, direction * 7)
  return addMonths(cursor, direction)
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const [view, setView] = useState('day')
  const [cursor, setCursor] = useState(() => startOfDay(new Date()))
  const [resourceId, setResourceId] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)

  const { data: resources } = useFetch(resourceService.list)

  const range = useMemo(() => getRange(view, cursor), [view, cursor])

  const loadBookings = useCallback(
    () =>
      bookingService.listInRange({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        resourceId: resourceId || undefined,
      }),
    [range, resourceId],
  )

  const { data: bookingData, loading, error, reload } = useFetch(loadBookings)

  const bookings = useMemo(
    () =>
      (bookingData ?? []).filter(
        (booking) => booking.status === BOOKING_STATUS.confirmed,
      ),
    [bookingData],
  )

  const activeResources = useMemo(
    () =>
      (resources ?? []).filter(
        (resource) =>
          resource.isActive &&
          (resourceId ? resource.id === resourceId : !resource.builtInRoom),
      ),
    [resources, resourceId],
  )

  const openBookingPage = useCallback(
    (targetResourceId, day, hour) => {
      const query = `date=${toDateValue(day)}&start=${minutesToTime(hour * 60)}`
      const target = (resources ?? []).find(
        (item) => item.id === targetResourceId,
      )
      navigate(
        target ? bookPath(target, query) : `/rooms?date=${toDateValue(day)}`,
      )
    },
    [navigate, resources],
  )

  const handleDaySlot = useCallback(
    (resource, hour) => openBookingPage(resource.id, cursor, hour),
    [openBookingPage, cursor],
  )

  const handleWeekSlot = useCallback(
    (day, hour) => openBookingPage(resourceId, day, hour),
    [openBookingPage, resourceId],
  )

  const handlePickDay = (day) => {
    setCursor(day)
    setView('day')
  }

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Click an empty slot to start a booking"
      />
      <CalendarToolbar
        view={view}
        onViewChange={setView}
        label={getLabel(view, cursor)}
        onPrevious={() =>
          setCursor((current) => shiftCursor(view, current, -1))
        }
        onNext={() => setCursor((current) => shiftCursor(view, current, 1))}
        onToday={() => setCursor(startOfDay(new Date()))}
        resources={(resources ?? []).filter(
          (resource) => resource.isActive && !resource.builtInRoom,
        )}
        resourceId={resourceId}
        onResourceChange={setResourceId}
      />

      {error && <ErrorMessage message={error} onRetry={reload} />}
      {loading && !bookingData && <PageLoader />}

      {!error && bookingData && (
        <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
          {view === 'day' && (
            <DayView
              filtered={Boolean(resourceId)}
              resources={activeResources}
              bookings={bookings}
              onSlotClick={handleDaySlot}
              onSelectBooking={setSelectedBooking}
            />
          )}
          {view === 'week' && (
            <WeekView
              weekStart={startOfWeek(cursor)}
              bookings={bookings}
              onSlotClick={handleWeekSlot}
              onSelectBooking={setSelectedBooking}
            />
          )}
          {view === 'month' && (
            <MonthView
              cursor={cursor}
              bookings={bookings}
              onPickDay={handlePickDay}
            />
          )}
        </div>
      )}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </>
  )
}
