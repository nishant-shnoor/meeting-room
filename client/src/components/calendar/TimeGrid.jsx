import BookingBlock from './BookingBlock'
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  HOUR_HEIGHT,
} from '../../utils/constants'
import { formatHour } from '../../utils/dateTime'
import cn from '../../utils/cn'

const hours = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
  (_, index) => CALENDAR_START_HOUR + index,
)

export default function TimeGrid({
  columns,
  minColumnWidth = 150,
  onSelectBooking,
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <div style={{ minWidth: 56 + columns.length * minColumnWidth }}>
        <div className="flex border-b border-gray-200 bg-gray-100 text-sm font-semibold text-gray-800">
          <div className="w-14 shrink-0" />
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                'min-w-0 flex-1 truncate border-l border-gray-200 px-2 py-2',
                column.highlight && 'bg-gray-200',
              )}
            >
              {column.header}
            </div>
          ))}
        </div>

        <div className="flex">
          <div className="w-14 shrink-0">
            {hours.map((hour) => (
              <div
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="pr-2 pt-1 text-right text-xs text-gray-500"
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {columns.map((column) => (
            <div
              key={column.key}
              className="relative min-w-0 flex-1 border-l border-gray-200"
            >
              {hours.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => column.onSlotClick(hour)}
                  aria-label={`Book ${column.header} at ${formatHour(hour)}`}
                  style={{ height: HOUR_HEIGHT }}
                  className="block w-full border-b border-gray-100 hover:bg-gray-50"
                />
              ))}
              {column.items.map((item) => (
                <BookingBlock
                  key={item.booking.id}
                  item={item}
                  label={column.labelFor(item.booking)}
                  onSelect={onSelectBooking}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
