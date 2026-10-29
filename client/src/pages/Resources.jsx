import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import QueryState from '../components/ui/QueryState'
import EmptyState from '../components/ui/EmptyState'
import TextField from '../components/ui/TextField'
import SelectField from '../components/ui/SelectField'
import ResourceCard from '../components/booking/ResourceCard'
import useFetch from '../hooks/useFetch'
import resourceService from '../services/resourceService'
import bookingService from '../services/bookingService'
import { BOOKING_STATUS, RESOURCE_TYPES } from '../utils/constants'
import { addDays, combineDateTime, todayValue } from '../utils/dateTime'

export default function Resources() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    minCapacity: '',
    date: searchParams.get('date') || todayValue(),
  })

  const {
    data: resources,
    loading,
    error,
    reload,
  } = useFetch(resourceService.list)

  const loadDayBookings = useCallback(() => {
    if (!filters.date) {
      return Promise.resolve([])
    }

    const dayStart = combineDateTime(filters.date, '00:00')

    return bookingService.listInRange({
      from: dayStart.toISOString(),
      to: addDays(dayStart, 1).toISOString(),
    })
  }, [filters.date])

  const { data: dayBookings } = useFetch(loadDayBookings)

  const bookedCounts = useMemo(() => {
    if (!dayBookings) {
      return null
    }

    const counts = {}
    dayBookings
      .filter((booking) => booking.status === BOOKING_STATUS.confirmed)
      .forEach((booking) => {
        counts[booking.resourceId] = (counts[booking.resourceId] ?? 0) + 1
      })
    return counts
  }, [dayBookings])

  const visibleResources = useMemo(() => {
    const search = filters.search.trim().toLowerCase()

    return (resources ?? []).filter(
      (resource) =>
        resource.isActive &&
        (!search || resource.name.toLowerCase().includes(search)) &&
        (!filters.type || resource.type === filters.type) &&
        (!filters.minCapacity ||
          (resource.capacity ?? 0) >= Number(filters.minCapacity)),
    )
  }, [resources, filters])

  const handleChange = (field) => (event) =>
    setFilters((current) => ({ ...current, [field]: event.target.value }))

  return (
    <>
      <PageHeader
        title="Rooms and resources"
        subtitle="Pick something to book"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField
          label="Search"
          placeholder="Search by name"
          value={filters.search}
          onChange={handleChange('search')}
        />
        <SelectField
          label="Type"
          placeholder="All"
          options={RESOURCE_TYPES}
          value={filters.type}
          onChange={handleChange('type')}
        />
        <TextField
          label="Min capacity"
          type="number"
          min={1}
          placeholder="Any"
          value={filters.minCapacity}
          onChange={handleChange('minCapacity')}
        />
        <TextField
          label="Date"
          type="date"
          min={todayValue()}
          value={filters.date}
          onChange={handleChange('date')}
        />
      </div>

      <QueryState
        loading={loading && !resources}
        error={error}
        onRetry={reload}
      >
        {visibleResources.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No resources found"
            text="Try changing the filters."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                date={filters.date}
                bookedCount={
                  bookedCounts ? (bookedCounts[resource.id] ?? 0) : undefined
                }
              />
            ))}
          </div>
        )}
      </QueryState>
    </>
  )
}
