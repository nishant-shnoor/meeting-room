import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../ui/Button'
import cn from '../../utils/cn'

const views = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]

export default function CalendarToolbar({
  view,
  onViewChange,
  label,
  onPrevious,
  onNext,
  onToday,
  resources,
  resourceId,
  onResourceChange,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          className="px-2"
          onClick={onPrevious}
          aria-label="Previous"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="secondary"
          className="px-2"
          onClick={onNext}
          aria-label="Next"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="secondary" onClick={onToday}>
          Today
        </Button>
      </div>

      <h2 className="min-w-0 flex-1 text-lg font-semibold text-gray-900">
        {label}
      </h2>

      <select
        value={resourceId}
        onChange={(event) => onResourceChange(event.target.value)}
        aria-label="Filter by resource"
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">All resources</option>
        {resources.map((resource) => (
          <option key={resource.id} value={resource.id}>
            {resource.name}
          </option>
        ))}
      </select>

      <div
        className="inline-flex rounded-md border border-gray-300 bg-white p-0.5"
        role="tablist"
      >
        {views.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={view === item.key}
            onClick={() => onViewChange(item.key)}
            className={cn(
              'rounded px-3 py-1.5 text-sm font-medium',
              view === item.key
                ? 'bg-gray-800 text-white'
                : 'text-gray-700 hover:bg-gray-100',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
