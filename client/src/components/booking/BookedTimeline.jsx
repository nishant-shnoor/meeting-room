import { formatHour } from '../../utils/dateTime'

export default function BookedTimeline({
  bookings,
  startHour,
  endHour,
  selection,
}) {
  const totalMinutes = (endHour - startHour) * 60

  const toPercent = (date, isEnd = false) => {
    const minutes =
      date.getHours() * 60 + date.getMinutes() || (isEnd ? 1440 : 0)
    return Math.min(
      Math.max(((minutes - startHour * 60) / totalMinutes) * 100, 0),
      100,
    )
  }

  const placeBlock = (start, end) => ({
    left: `${toPercent(start)}%`,
    width: `${Math.max(toPercent(end, true) - toPercent(start), 0)}%`,
  })

  const step = endHour - startHour > 10 ? 2 : 1
  const labelHours = Array.from(
    { length: Math.floor((endHour - startHour) / step) + 1 },
    (_, index) => startHour + index * step,
  )

  return (
    <div>
      <div
        className="relative h-12 overflow-hidden rounded-md border border-gray-300 bg-white"
        role="img"
        aria-label="Already booked time on this day"
      >
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="absolute inset-y-0 flex items-center justify-center border-x border-gray-400 bg-gray-300 text-xs text-gray-700"
            style={placeBlock(
              new Date(booking.startTime),
              new Date(booking.endTime),
            )}
          >
            Booked
          </div>
        ))}
        {selection && (
          <div
            className="absolute inset-y-0 border-2 border-dashed border-gray-800 bg-gray-800/10"
            style={placeBlock(selection.start, selection.end)}
          />
        )}
      </div>
      <div className="relative mt-1 h-4 text-xs text-gray-500">
        {labelHours.map((hour) => (
          <span
            key={hour}
            className="absolute -translate-x-1/2"
            style={{
              left: `${((hour - startHour) / (endHour - startHour)) * 100}%`,
            }}
          >
            {formatHour(hour)}
          </span>
        ))}
      </div>
    </div>
  )
}
