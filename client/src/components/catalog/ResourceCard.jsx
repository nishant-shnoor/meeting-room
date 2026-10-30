import { Link } from 'react-router-dom'
import { CalendarPlus, Info, Users } from 'lucide-react'
import BuiltInChips from './BuiltInChips'
import ResourceImage from '../assets/ResourceImage'
import buttonClass from '../../utils/buttonStyles'
import { resolveAssetKey, resourceAssetMeta } from '../../utils/assets'
import { bookPath } from '../../utils/paths'
import cn from '../../utils/cn'

export default function ResourceCard({
  resource,
  bookedCount,
  date,
  onDetails,
}) {
  const isRoom = resource.type === 'room'
  const meta = !isRoom ? resourceAssetMeta(resolveAssetKey(resource)) : null

  const availability =
    bookedCount === undefined
      ? null
      : bookedCount === 0
        ? 'Free all day'
        : `${bookedCount} ${bookedCount === 1 ? 'booking' : 'bookings'} on this day`

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-shadow hover:shadow-lg">
      <div className="relative">
        <ResourceImage
          resource={resource}
          className="block aspect-[16/9] w-full"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
          {isRoom ? (
            <>
              <Users className="size-3.5 text-brand" />
              Up to {resource.capacity}
            </>
          ) : (
            <>
              <meta.icon className="size-3.5 text-brand" />
              {meta.label}
            </>
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold text-ink">{resource.name}</h3>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted">
          {resource.description ||
            resource.facilities ||
            'No description added yet'}
        </p>

        {isRoom && (
          <div className="mt-3 min-h-7">
            {resource.builtIn.length > 0 ? (
              <BuiltInChips items={resource.builtIn} limit={3} />
            ) : (
              <span className="text-xs text-faint">No built-in resources</span>
            )}
          </div>
        )}

        {availability && (
          <p
            className={cn(
              'mt-3 flex items-center gap-2 text-xs font-semibold',
              bookedCount === 0 ? 'text-green-ink' : 'text-amber-ink',
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                bookedCount === 0 ? 'bg-green' : 'bg-amber',
              )}
            />
            {availability}
          </p>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <button
            type="button"
            onClick={() => onDetails(resource)}
            className={buttonClass('secondary')}
          >
            <Info className="size-4" />
            Details
          </button>
          <Link
            to={bookPath(resource, `date=${date}`)}
            className={buttonClass('primary')}
          >
            <CalendarPlus className="size-4" />
            Book now
          </Link>
        </div>
      </div>
    </article>
  )
}
