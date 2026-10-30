import { useCallback, useState } from 'react'
import { CalendarX } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import QueryState from '../../components/ui/QueryState'
import EmptyState from '../../components/ui/EmptyState'
import TextField from '../../components/ui/TextField'
import SelectField from '../../components/ui/SelectField'
import BookingsTable from '../../components/booking/BookingsTable'
import CancelBookingDialog from '../../components/booking/CancelBookingDialog'
import useDebounce from '../../hooks/useDebounce'
import useFetch from '../../hooks/useFetch'
import bookingService from '../../services/bookingService'
import resourceService from '../../services/resourceService'
import { BOOKING_STATUS } from '../../utils/constants'

const statusOptions = Object.values(BOOKING_STATUS).map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1),
}))

export default function AllBookings() {
  const [filters, setFilters] = useState({
    date: '',
    resourceId: '',
    status: '',
    search: '',
  })
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const search = useDebounce(filters.search.trim())

  const { data: resources } = useFetch(resourceService.listAll)

  const loadBookings = useCallback(
    () =>
      bookingService.listAll({
        date: filters.date || undefined,
        resourceId: filters.resourceId || undefined,
        status: filters.status || undefined,
        search: search || undefined,
      }),
    [filters.date, filters.resourceId, filters.status, search],
  )

  const { data: bookings, loading, error, reload } = useFetch(loadBookings)

  const handleChange = (field) => (event) =>
    setFilters((current) => ({ ...current, [field]: event.target.value }))

  const handleCancelled = () => {
    setBookingToCancel(null)
    reload()
  }

  const resourceOptions = (resources ?? []).map((resource) => ({
    value: resource.id,
    label: resource.name,
  }))

  return (
    <>
      <PageHeader
        title="All bookings"
        subtitle="Admins can edit or cancel any upcoming booking"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField
          label="Date"
          type="date"
          value={filters.date}
          onChange={handleChange('date')}
        />
        <SelectField
          label="Resource"
          placeholder="All"
          options={resourceOptions}
          value={filters.resourceId}
          onChange={handleChange('resourceId')}
        />
        <SelectField
          label="Status"
          placeholder="All"
          options={statusOptions}
          value={filters.status}
          onChange={handleChange('status')}
        />
        <TextField
          label="User"
          placeholder="Search by name or email"
          value={filters.search}
          onChange={handleChange('search')}
        />
      </div>

      <QueryState loading={loading && !bookings} error={error} onRetry={reload}>
        <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
          {bookings?.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title="No bookings found"
              text="Try changing the filters."
            />
          ) : (
            <BookingsTable
              bookings={bookings ?? []}
              showUser
              onCancel={setBookingToCancel}
            />
          )}
        </div>
      </QueryState>

      {bookingToCancel && (
        <CancelBookingDialog
          booking={bookingToCancel}
          onClose={() => setBookingToCancel(null)}
          onCancelled={handleCancelled}
        />
      )}
    </>
  )
}
