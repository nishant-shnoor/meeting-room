import { Link } from 'react-router-dom'
import { DoorOpen, Projector, Users } from 'lucide-react'
import buttonClass from '../../utils/buttonStyles'

export default function ResourceCard({ resource, bookedCount, date }) {
  const isRoom = resource.type === 'room'
  const Icon = isRoom ? DoorOpen : Projector

  const availability =
    bookedCount === undefined
      ? null
      : bookedCount === 0
        ? 'Free all day'
        : `${bookedCount} ${bookedCount === 1 ? 'booking' : 'bookings'} on this day`

  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex h-24 items-center justify-center rounded-md bg-gray-100 text-gray-400">
        <Icon className="size-10" />
      </div>
      <h3 className="font-semibold text-gray-900">{resource.name}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
        {isRoom && (
          <>
            <Users className="size-4" />
            {resource.capacity} people
            <span className="text-gray-300">|</span>
          </>
        )}
        <span className="capitalize">{resource.type}</span>
      </p>
      <p className="mt-2 flex-1 text-sm text-gray-500">
        {resource.facilities || 'No facilities listed'}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500">{availability}</span>
        <div className="flex gap-2">
          <Link
            to={`/resources/${resource.id}?date=${date}`}
            className={buttonClass('secondary')}
          >
            Details
          </Link>
          <Link
            to={`/resources/${resource.id}/book?date=${date}`}
            className={buttonClass('primary')}
          >
            Book
          </Link>
        </div>
      </div>
    </article>
  )
}
