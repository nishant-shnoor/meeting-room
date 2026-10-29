import { useMemo } from 'react'
import { getMonthGrid, isSameDay, now, toDateValue } from '../../utils/dateTime'
import cn from '../../utils/cn'

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function MonthView({ cursor, bookings, onPickDay }) {
  const days = useMemo(() => getMonthGrid(cursor), [cursor])

  const countByDay = useMemo(() => {
    const counts = {}
    bookings.forEach((booking) => {
      const key = toDateValue(new Date(booking.startTime))
      counts[key] = (counts[key] ?? 0) + 1
    })

    return counts
  }, [bookings])

  const today = now()

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-700 sm:text-sm">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const count = countByDay[toDateValue(day)]
          const inMonth = day.getMonth() === cursor.getMonth()

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onPickDay(day)}
              className={cn(
                'flex min-h-16 flex-col items-start gap-1 border-b border-r border-gray-100 p-1.5 text-left hover:bg-gray-50 sm:min-h-24 sm:p-2',
                !inMonth && 'bg-gray-50 text-gray-400',
                isSameDay(day, today) && 'bg-gray-200 hover:bg-gray-200',
              )}
            >
              <span
                className={cn(
                  'text-xs sm:text-sm',
                  isSameDay(day, today) && 'font-bold',
                )}
              >
                {day.getDate()}
              </span>
              {count && (
                <span className="rounded bg-gray-300 px-1.5 py-0.5 text-[10px] text-gray-800 sm:text-xs">
                  {count}
                  <span className="hidden sm:inline">
                    {count === 1 ? ' booking' : ' bookings'}
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
