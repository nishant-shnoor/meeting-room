import { resourceIconFor } from '../../utils/assets'
import cn from '../../utils/cn'

export default function BuiltInChips({ items, limit, className }) {
  if (!items?.length) return null
  const shown = limit ? items.slice(0, limit) : items
  const hidden = items.length - shown.length

  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {shown.map((item) => {
        const Icon = resourceIconFor(item)
        return (
          <li
            key={item.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-2.5 py-1 text-xs font-semibold text-teal-ink"
          >
            <Icon className="size-3.5" />
            {item.name}
          </li>
        )
      })}
      {hidden > 0 && (
        <li className="inline-flex items-center rounded-full bg-sunken px-2.5 py-1 text-xs font-semibold text-muted">
          +{hidden} more
        </li>
      )}
    </ul>
  )
}
