import { useRef, useState } from 'react'
import { minutesToTime } from '../../utils/dateTime'
import cn from '../../utils/cn'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export default function AvailabilityTimeline({
  rows,
  rangeStart,
  rangeEnd,
  step,
  duration,
  selection,
  checker,
  onPick,
  disabled,
}) {
  const surfaceRef = useRef(null)
  const [hoverStart, setHoverStart] = useState(null)
  const total = rangeEnd - rangeStart
  const percent = (minutes) =>
    ((clamp(minutes, rangeStart, rangeEnd) - rangeStart) / total) * 100
  const place = (start, end) => ({
    left: `${percent(start)}%`,
    width: `${Math.max(percent(end) - percent(start), 0)}%`,
  })

  const hourStep = total / 60 > 10 ? 2 : 1
  const hourMarks = []
  for (let minutes = rangeStart; minutes <= rangeEnd; minutes += hourStep * 60)
    hourMarks.push(minutes)

  const startFromPointer = (event) => {
    const box = surfaceRef.current.getBoundingClientRect()
    const raw =
      rangeStart + clamp((event.clientX - box.left) / box.width, 0, 1) * total
    const latestStart = Math.floor((rangeEnd - duration) / step) * step
    return clamp(
      Math.floor(raw / step) * step,
      rangeStart,
      Math.max(latestStart, rangeStart),
    )
  }

  const hoverResult =
    hoverStart === null ? null : checker.check(hoverStart, duration)

  const handleClick = (event) => {
    if (disabled) return
    const start = startFromPointer(event)
    if (checker.check(start, duration).ok) onPick(start)
  }

  const showLabels = rows.length > 1

  return (
    <div>
      <div
        ref={surfaceRef}
        className={cn(
          'relative touch-pan-y select-none',
          !disabled && 'cursor-pointer',
        )}
        role="group"
        aria-label="Bookings on this day. Use the time buttons below to pick a slot with the keyboard."
        onPointerMove={(event) =>
          !disabled && setHoverStart(startFromPointer(event))
        }
        onPointerDown={(event) =>
          !disabled && setHoverStart(startFromPointer(event))
        }
        onPointerLeave={() => setHoverStart(null)}
        onClick={handleClick}
      >
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.key}>
              {showLabels && (
                <p className="mb-1 truncate text-xs font-semibold text-muted">
                  {row.label}
                </p>
              )}
              <div
                className={cn(
                  'relative overflow-hidden rounded-lg border border-line-strong bg-surface',
                  row.isMain ? 'h-14' : 'h-9',
                )}
              >
                {(!row.isOpen || row.openMinutes > rangeStart) && (
                  <div
                    className="hatch absolute inset-y-0"
                    style={place(
                      rangeStart,
                      row.isOpen ? row.openMinutes : rangeEnd,
                    )}
                  />
                )}
                {row.isOpen && row.closeMinutes < rangeEnd && (
                  <div
                    className="hatch absolute inset-y-0"
                    style={place(row.closeMinutes, rangeEnd)}
                  />
                )}
                {hourMarks.slice(1, -1).map((minutes) => (
                  <div
                    key={minutes}
                    className="absolute inset-y-0 w-px bg-line"
                    style={{ left: `${percent(minutes)}%` }}
                  />
                ))}
                {row.busy.map((item) => (
                  <div
                    key={`${item.id}-${item.startMinutes}`}
                    title={`${item.isMine ? 'Booked by you' : `Booked by ${item.userName}`}, ${minutesToTime(item.startMinutes)} - ${minutesToTime(item.endMinutes)}${item.purpose ? `, ${item.purpose}` : ''}`}
                    className={cn(
                      'absolute inset-y-1 flex flex-col justify-center overflow-hidden rounded-md border px-1.5 text-[11px] leading-tight',
                      item.isMine
                        ? 'border-brand bg-brand-soft text-brand-ink'
                        : 'border-amber bg-amber-soft text-amber-ink',
                    )}
                    style={place(item.startMinutes, item.endMinutes)}
                  >
                    <span className="truncate font-bold">
                      {item.isMine ? 'You' : item.userName}
                    </span>
                    {row.isMain && (
                      <span className="truncate opacity-80">
                        {minutesToTime(item.startMinutes)} -{' '}
                        {minutesToTime(item.endMinutes)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0">
          {selection && (
            <div
              className="absolute inset-y-0 rounded-lg border-2 border-green bg-green/20"
              style={place(selection.start, selection.end)}
            >
              <span className="absolute -top-2 left-1 rounded bg-green px-1.5 py-0.5 text-[10px] font-bold text-white dark:text-[#0b0e1c]">
                Your slot
              </span>
            </div>
          )}
          {hoverResult && hoverStart !== null && (
            <div
              className={cn(
                'absolute inset-y-0 rounded-lg border-2 border-dashed',
                hoverResult.ok
                  ? 'border-green bg-green/15'
                  : 'hatch border-rose bg-rose/15',
              )}
              style={place(hoverStart, hoverStart + duration)}
            />
          )}
        </div>
      </div>

      <div
        className="relative mt-1.5 h-4 text-xs text-muted"
        aria-hidden="true"
      >
        {hourMarks.map((minutes, index) => (
          <span
            key={minutes}
            className={cn(
              'absolute',
              index % 2 === 1 && 'max-sm:hidden',
              index === 0
                ? ''
                : index === hourMarks.length - 1
                  ? '-translate-x-full'
                  : '-translate-x-1/2',
            )}
            style={{ left: `${percent(minutes)}%` }}
          >
            {minutesToTime(minutes)}
          </span>
        ))}
      </div>

      <p
        className={cn(
          'mt-3 min-h-5 text-sm font-medium',
          hoverResult
            ? hoverResult.ok
              ? 'text-green-ink'
              : 'text-rose-ink'
            : 'text-muted',
        )}
        aria-live="polite"
      >
        {hoverResult
          ? `${minutesToTime(hoverStart)} - ${minutesToTime(hoverStart + duration)}: ${hoverResult.ok ? 'free, click to choose this slot' : hoverResult.reason}`
          : disabled
            ? ''
            : 'Hover over the bar to preview a slot, then click to choose it.'}
      </p>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-line-strong bg-surface" />
          Free
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-amber bg-amber-soft" />
          Booked by others
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-brand bg-brand-soft" />
          Your bookings
        </li>
        <li className="flex items-center gap-1.5">
          <span className="hatch size-3 rounded border border-line-strong" />
          Closed
        </li>
      </ul>
    </div>
  )
}
