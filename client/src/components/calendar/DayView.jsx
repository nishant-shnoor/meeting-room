import { useMemo } from 'react'
import TimeGrid from './TimeGrid'
import { groupByLane } from '../../utils/booking'

const includesResource = (booking, id) =>
  booking.resourceId === id ||
  booking.builtIn?.some((item) => item.resourceId === id) ||
  booking.addOns?.some((item) => item.resourceId === id)

export default function DayView({
  resources,
  bookings,
  filtered = false,
  onSlotClick,
  onSelectBooking,
}) {
  const columns = useMemo(
    () =>
      resources.map((resource) => ({
        key: resource.id,
        header: resource.name,
        items: groupByLane(
          bookings.filter((booking) =>
            filtered
              ? includesResource(booking, resource.id)
              : booking.resourceId === resource.id,
          ),
        ),
        labelFor: (booking) => booking.purpose || booking.userName || 'Booked',
        onSlotClick: (hour) => onSlotClick(resource, hour),
      })),
    [resources, bookings, filtered, onSlotClick],
  )

  return (
    <TimeGrid
      columns={columns}
      minColumnWidth={170}
      onSelectBooking={onSelectBooking}
    />
  )
}
