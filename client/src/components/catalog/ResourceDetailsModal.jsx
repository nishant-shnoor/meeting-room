import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import Modal from '../ui/Modal'
import QueryState from '../ui/QueryState'
import ResourceSummary from '../booking/ResourceSummary'
import useFetch from '../../hooks/useFetch'
import resourceService from '../../services/resourceService'
import buttonClass from '../../utils/buttonStyles'
import { bookPath } from '../../utils/paths'

export default function ResourceDetailsModal({ resource, date, onClose }) {
  const loadSetup = useCallback(
    () => resourceService.getBookingSetup(resource.id),
    [resource.id],
  )
  const { data, loading, error, reload } = useFetch(loadSetup)

  return (
    <Modal
      title={resource.type === 'room' ? 'Room details' : 'Resource details'}
      onClose={onClose}
      wide
    >
      <QueryState loading={loading} error={error} onRetry={reload}>
        {data && <ResourceSummary {...data} embedded />}
      </QueryState>
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className={buttonClass('secondary')}
        >
          Close
        </button>
        <Link
          to={bookPath(resource, date ? `date=${date}` : '')}
          className={buttonClass('primary')}
        >
          <CalendarPlus className="size-4" />
          Book now
        </Link>
      </div>
    </Modal>
  )
}
