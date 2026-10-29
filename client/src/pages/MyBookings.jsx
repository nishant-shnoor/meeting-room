import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarX } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import QueryState from '../components/ui/QueryState'
import EmptyState from '../components/ui/EmptyState'
import BookingsTable from '../components/booking/BookingsTable'
import CancelBookingDialog from '../components/booking/CancelBookingDialog'
import useFetch from '../hooks/useFetch'
import bookingService from '../services/bookingService'
import { BOOKING_STATUS } from '../utils/constants'
import { getDisplayStatus } from '../utils/booking'
import buttonClass from '../utils/buttonStyles'
import cn from '../utils/cn'

const tabs = [
  { key: 'upcoming', label: 'Upcoming', status: BOOKING_STATUS.confirmed },
  { key: 'past', label: 'Past', status: BOOKING_STATUS.completed },
  { key: 'cancelled', label: 'Cancelled', status: BOOKING_STATUS.cancelled },
]

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState('upcoming')
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const { data, loading, error, reload } = useFetch(bookingService.listMine)

  const visibleBookings = useMemo(() => {
    const tab = tabs.find((item) => item.key === activeTab)
    const matching = (data ?? []).filter(
      (booking) => getDisplayStatus(booking) === tab.status,
    )
    const direction = activeTab === 'upcoming' ? 1 : -1

    return matching.sort(
      (a, b) => direction * (new Date(a.startTime) - new Date(b.startTime)),
    )
  }, [data, activeTab])

  const handleCancelled = () => {
    setBookingToCancel(null)
    reload()
  }

  return (
    <>
      <PageHeader title="My bookings">
        <Link to="/resources" className={buttonClass('primary')}>
          New booking
        </Link>
      </PageHeader>

      <div className="mb-4 flex gap-1 border-b border-gray-200" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium',
              activeTab === tab.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <QueryState loading={loading && !data} error={error} onRetry={reload}>
        {visibleBookings.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title={`No ${activeTab} bookings`}
            text="Bookings you make will show up here."
          />
        ) : (
          <BookingsTable
            bookings={visibleBookings}
            onCancel={setBookingToCancel}
          />
        )}
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
