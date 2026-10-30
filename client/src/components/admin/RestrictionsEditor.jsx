import { useCallback, useState } from 'react'
import { Info } from 'lucide-react'
import Button from '../ui/Button'
import QueryState from '../ui/QueryState'
import TextField from '../ui/TextField'
import SelectField from '../ui/SelectField'
import useFetch from '../../hooks/useFetch'
import useToast from '../../hooks/useToast'
import resourceService from '../../services/resourceService'
import { SLOT_STEP_OPTIONS } from '../../utils/constants'
import getErrorMessage from '../../utils/errorMessage'
import { normalizeRestrictions } from '../../utils/hours'
import { validateRestrictions } from '../../utils/validators'

const stepOptions = SLOT_STEP_OPTIONS.map((minutes) => ({
  value: minutes,
  label: `${minutes} minutes`,
}))

function RestrictionsForm({ resourceId, initialValues, onSaved }) {
  const toast = useToast()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    const foundErrors = validateRestrictions(values)
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length) return

    setSaving(true)
    try {
      await resourceService.saveRestrictions(resourceId, {
        minDurationMinutes: Number(values.minDurationMinutes),
        maxDurationMinutes: Number(values.maxDurationMinutes),
        maxAdvanceDays: Number(values.maxAdvanceDays),
        slotStepMinutes: Number(values.slotStepMinutes),
      })
      toast.success('Restrictions saved')
      onSaved()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form
        onSubmit={handleSave}
        noValidate
        className="space-y-4 rounded-lg border border-line bg-surface p-5"
      >
        <TextField
          label="Minimum booking length (minutes)"
          type="number"
          min={1}
          value={values.minDurationMinutes}
          onChange={handleChange('minDurationMinutes')}
          error={errors.minDurationMinutes}
        />
        <TextField
          label="Maximum booking length (minutes)"
          type="number"
          min={1}
          value={values.maxDurationMinutes}
          onChange={handleChange('maxDurationMinutes')}
          error={errors.maxDurationMinutes}
        />
        <TextField
          label="How far ahead people can book (days)"
          type="number"
          min={1}
          value={values.maxAdvanceDays}
          onChange={handleChange('maxAdvanceDays')}
          error={errors.maxAdvanceDays}
        />
        <SelectField
          label="Time slot step"
          options={stepOptions}
          value={values.slotStepMinutes}
          onChange={handleChange('slotStepMinutes')}
          error={errors.slotStepMinutes}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={() => setValues(initialValues)}>
            Reset
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </div>
      </form>

      <aside className="h-fit rounded-lg border border-line bg-surface p-5 text-sm text-muted">
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-ink">
          <Info className="size-4" />
          How these rules are used
        </h3>
        <p>Checked when a booking is made or edited.</p>
        <ul className="mt-3 list-inside list-disc space-y-1">
          <li>Minimum and maximum length</li>
          <li>How far ahead a booking can start</li>
          <li>Start and end times must fit the slot step</li>
        </ul>
        <p className="mt-3">
          Employees cannot book outside these rules. Admins can edit any
          booking.
        </p>
      </aside>
    </div>
  )
}

export default function RestrictionsEditor({ resourceId }) {
  const loadRestrictions = useCallback(
    () => resourceService.getRestrictions(resourceId),
    [resourceId],
  )
  const { data, loading, error, reload } = useFetch(loadRestrictions)

  return (
    <QueryState loading={loading} error={error} onRetry={reload}>
      {data && (
        <RestrictionsForm
          resourceId={resourceId}
          initialValues={normalizeRestrictions(data)}
          onSaved={reload}
        />
      )}
    </QueryState>
  )
}
