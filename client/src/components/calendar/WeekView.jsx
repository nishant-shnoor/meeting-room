import { useMemo } from 'react'
import TimeGrid from './TimeGrid'
import { groupByLane } from '../../utils/booking'
import { addDays, isSameDay, now, toDateValue } from '../../utils/dateTime'

export default function WeekView({
  weekStart,
  bookings,
  onSlotClick,
  onSelectBooking,
}) {
  const columns = useMemo(() => {
    const today = now()
    return Array.from({ length: 7 }, (_, offset) => {
      const day = addDays(weekStart, offset)
      const dayBookings = bookings.filter((booking) =>
        isSameDay(new Date(booking.startTime), day),
      )
      return {
        key: toDateValue(day),
        header: day.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
        }),
        highlight: isSameDay(day, today),
        items: groupByLane(dayBookings),
        labelFor: (booking) => booking.resourceName,
        onSlotClick: (hour) => onSlotClick(day, hour),
      }
    })
  }, [weekStart, bookings, onSlotClick])

  return (
    <TimeGrid
      columns={columns}
      minColumnWidth={120}
      onSelectBooking={onSelectBooking}
    />
  )
}
