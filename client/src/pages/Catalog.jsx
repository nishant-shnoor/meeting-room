import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import QueryState from '../components/ui/QueryState'
import EmptyState from '../components/ui/EmptyState'
import TextField from '../components/ui/TextField'
import SelectField from '../components/ui/SelectField'
import ResourceCard from '../components/catalog/ResourceCard'
import ResourceDetailsModal from '../components/catalog/ResourceDetailsModal'
import useFetch from '../hooks/useFetch'
import resourceService from '../services/resourceService'
import bookingService from '../services/bookingService'
import { BOOKING_STATUS } from '../utils/constants'
import { RESOURCE_ASSETS, resolveAssetKey } from '../utils/assets'
import { addDays, combineDateTime, todayValue } from '../utils/dateTime'

const copy = {
  room: {
    title: 'Meeting rooms',
    subtitle: 'Choose a room, then pick a time that is free',
    empty: 'No meeting rooms found',
  },
  equipment: {
    title: 'Resources',
    subtitle:
      'Projectors, boards, desks and more that you can book on their own',
    empty: 'No resources found',
  },
}

const includesOptions = RESOURCE_ASSETS.filter(
  (asset) => asset.key !== 'other',
).map((asset) => ({ value: asset.key, label: asset.label }))

export default function Catalog({ kind }) {
  const isRoom = kind === 'room'
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    search: '',
    minCapacity: '',
    includes: '',
    date: searchParams.get('date') || todayValue(),
  })
  const [detailsTarget, setDetailsTarget] = useState(null)

  const loadResources = useCallback(
    () =>
      isRoom ? resourceService.listRooms() : resourceService.listEquipment(),
    [isRoom],
  )
  const { data: resources, loading, error, reload } = useFetch(loadResources)

  const loadDayBookings = useCallback(() => {
    if (!filters.date) return Promise.resolve([])
    const dayStart = combineDateTime(filters.date, '00:00')
    return bookingService.listInRange({
      from: dayStart.toISOString(),
      to: addDays(dayStart, 1).toISOString(),
    })
  }, [filters.date])

  const { data: dayBookings } = useFetch(loadDayBookings)

  const bookedCounts = useMemo(() => {
    if (!dayBookings) return null
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
        !resource.builtInRoom &&
        (!search || resource.name.toLowerCase().includes(search)) &&
        (!filters.minCapacity ||
          (resource.capacity ?? 0) >= Number(filters.minCapacity)) &&
        (!filters.includes ||
          resource.builtIn.some(
            (item) =>
              resolveAssetKey({ ...item, type: 'equipment' }) ===
              filters.includes,
          )),
    )
  }, [resources, filters])

  const handleChange = (field) => (event) =>
    setFilters((current) => ({ ...current, [field]: event.target.value }))

  const { title, subtitle, empty } = copy[kind]

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />

      <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <TextField
          className="col-span-2 sm:col-span-1"
          label="Search"
          placeholder="Search by name"
          value={filters.search}
          onChange={handleChange('search')}
        />
        {isRoom ? (
          <>
            <TextField
              label="Seats needed"
              type="number"
              min={1}
              placeholder="Any"
              value={filters.minCapacity}
              onChange={handleChange('minCapacity')}
            />
            <SelectField
              label="Has built in"
              placeholder="Anything"
              options={includesOptions}
              value={filters.includes}
              onChange={handleChange('includes')}
            />
          </>
        ) : (
          <div className="hidden lg:block lg:col-span-2" />
        )}
        <TextField
          className="col-span-2 sm:col-span-1"
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
            title={empty}
            text="Try changing the filters."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                date={filters.date}
                bookedCount={
                  bookedCounts ? (bookedCounts[resource.id] ?? 0) : undefined
                }
                onDetails={setDetailsTarget}
              />
            ))}
          </div>
        )}
      </QueryState>

      {detailsTarget && (
        <ResourceDetailsModal
          resource={detailsTarget}
          date={filters.date}
          onClose={() => setDetailsTarget(null)}
        />
      )}
    </>
  )
}
