import { useMemo } from 'react'
import { Check } from 'lucide-react'
import QueryState from '../ui/QueryState'
import useFetch from '../../hooks/useFetch'
import resourceService from '../../services/resourceService'
import { resourceIconFor } from '../../utils/assets'
import cn from '../../utils/cn'

export default function BuiltInPicker({ roomId, value, onChange, error }) {
  const {
    data,
    loading,
    error: loadError,
    reload,
  } = useFetch(resourceService.listAllEquipment)

  const options = useMemo(
    () =>
      (data ?? []).filter(
        (item) => !item.builtInRoom || item.builtInRoom.id === roomId,
      ),
    [data, roomId],
  )

  const toggle = (id) =>
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
    )

  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink-soft">
        Built-in resources
      </legend>
      <p className="mb-2 text-xs text-muted">
        These stay in the room and come with every booking. Anyone can still add
        other resources when booking.
      </p>
      <QueryState loading={loading && !data} error={loadError} onRetry={reload}>
        {options.length === 0 ? (
          <p className="rounded-xl bg-sunken p-3 text-sm text-muted">
            No free resources yet. Add some on the Manage resources page first.
          </p>
        ) : (
          <div className="grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
            {options.map((item) => {
              const Icon = resourceIconFor(item)
              const selected = value.includes(item.id)
              return (
                <label
                  key={item.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand',
                    selected
                      ? 'border-teal bg-teal-soft text-teal-ink'
                      : 'border-line bg-surface text-ink-soft hover:bg-subtle',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggle(item.id)}
                    className="sr-only"
                  />
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {item.name}
                  </span>
                  {!item.isActive && (
                    <span className="text-xs text-faint">disabled</span>
                  )}
                  {selected && <Check className="size-4 shrink-0" />}
                </label>
              )
            })}
          </div>
        )}
      </QueryState>
      {error && <p className="mt-1 text-xs text-rose-ink">{error}</p>}
    </fieldset>
  )
}
