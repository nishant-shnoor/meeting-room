import { useCallback, useState } from 'react'
import Button from '../ui/Button'
import QueryState from '../ui/QueryState'
import useFetch from '../../hooks/useFetch'
import useToast from '../../hooks/useToast'
import resourceService from '../../services/resourceService'
import { DAY_NAMES, WEEK_ORDER } from '../../utils/constants'
import getErrorMessage from '../../utils/errorMessage'
import { normalizeHours } from '../../utils/hours'
import { validateHours } from '../../utils/validators'
import cn from '../../utils/cn'
import inputClass from '../../utils/fieldStyles'

function HoursForm({ resourceId, initialRows, onSaved }) {
  const toast = useToast()
  const [rows, setRows] = useState(initialRows)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const updateRow = (dayOfWeek, changes) => {
    setRows((current) =>
      current.map((row) =>
        row.dayOfWeek === dayOfWeek ? { ...row, ...changes } : row,
      ),
    )
    setErrors((current) => ({ ...current, [dayOfWeek]: undefined }))
  }

  const handleSave = async () => {
    const foundErrors = validateHours(rows)
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length) return

    setSaving(true)
    try {
      await resourceService.saveHours(resourceId, rows)
      toast.success('Operating hours saved')
      onSaved()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-sunken text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">Day</th>
              <th className="px-4 py-3 font-semibold">Open</th>
              <th className="px-4 py-3 font-semibold">From</th>
              <th className="px-4 py-3 font-semibold">To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {WEEK_ORDER.map((day) => {
              const row = rows.find((item) => item.dayOfWeek === day)
              return (
                <tr key={day}>
                  <td className="px-4 py-3 font-medium text-ink">
                    {DAY_NAMES[day]}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.isOpen}
                      onChange={(event) =>
                        updateRow(day, { isOpen: event.target.checked })
                      }
                      aria-label={`${DAY_NAMES[day]} open`}
                      className="size-4 accent-brand"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={row.openTime}
                      disabled={!row.isOpen}
                      onChange={(event) =>
                        updateRow(day, { openTime: event.target.value })
                      }
                      aria-label={`${DAY_NAMES[day]} opening time`}
                      className={cn(inputClass(errors[day]), 'max-w-40')}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={row.closeTime}
                        disabled={!row.isOpen}
                        onChange={(event) =>
                          updateRow(day, { closeTime: event.target.value })
                        }
                        aria-label={`${DAY_NAMES[day]} closing time`}
                        className={cn(inputClass(errors[day]), 'max-w-40')}
                      />
                      {errors[day] && (
                        <span className="text-xs text-rose-ink">
                          {errors[day]}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
        <p className="text-xs text-muted">
          New hours apply to new bookings only. Existing bookings are not
          changed.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setRows(initialRows)}>
            Reset
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function HoursEditor({ resourceId }) {
  const loadHours = useCallback(
    () => resourceService.getHours(resourceId),
    [resourceId],
  )
  const { data, loading, error, reload } = useFetch(loadHours)

  return (
    <QueryState loading={loading} error={error} onRetry={reload}>
      {data && (
        <HoursForm
          resourceId={resourceId}
          initialRows={normalizeHours(data)}
          onSaved={reload}
        />
      )}
    </QueryState>
  )
}
