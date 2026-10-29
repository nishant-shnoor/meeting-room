import { useMemo } from 'react'
import TimeGrid from './TimeGrid'
import { groupByLane } from '../../utils/booking'

export default function DayView({
  resources,
  bookings,
  onSlotClick,
  onSelectBooking,
}) {
  const columns = useMemo(
    () =>
      resources.map((resource) => ({
        key: resource.id,
        header: resource.name,
        items: groupByLane(
          bookings.filter((booking) => booking.resourceId === resource.id),
        ),
        labelFor: (booking) => booking.purpose || booking.userName || 'Booked',
        onSlotClick: (hour) => onSlotClick(resource, hour),
      })),
    [resources, bookings, onSlotClick],
  )

  return (
    <TimeGrid
      columns={columns}
      minColumnWidth={170}
      onSelectBooking={onSelectBooking}
    />
  )
}
