import { useState } from 'react'
import AssetPicker from './AssetPicker'
import BuiltInPicker from './BuiltInPicker'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import TextField from '../ui/TextField'
import TextAreaField from '../ui/TextAreaField'
import useToast from '../../hooks/useToast'
import resourceService from '../../services/resourceService'
import getErrorMessage from '../../utils/errorMessage'
import { validateResource } from '../../utils/validators'

const emptyValues = {
  name: '',
  capacity: '',
  facilities: '',
  description: '',
  assetKey: '',
  builtInResourceIds: [],
}

const valuesFrom = (resource) => ({
  name: resource.name,
  capacity: resource.capacity ?? '',
  facilities: resource.facilities ?? '',
  description: resource.description ?? '',
  assetKey: resource.assetKey ?? '',
  builtInResourceIds: (resource.builtIn ?? []).map((item) => item.id),
})

const labels = {
  room: {
    add: 'Add meeting room',
    edit: 'Edit meeting room',
    saved: 'Meeting room saved',
    created: 'Meeting room added',
  },
  equipment: {
    add: 'Add resource',
    edit: 'Edit resource',
    saved: 'Resource saved',
    created: 'Resource added',
  },
}

export default function ResourceFormModal({
  kind,
  resource,
  onClose,
  onSaved,
}) {
  const toast = useToast()
  const isRoom = kind === 'room'
  const [values, setValues] = useState(
    resource ? valuesFrom(resource) : emptyValues,
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const text = labels[kind]

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const setField = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const foundErrors = validateResource({ ...values, type: kind })
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length) return

    const payload = {
      name: values.name.trim(),
      type: kind,
      capacity: isRoom ? Number(values.capacity) : null,
      facilities: values.facilities.trim(),
      description: values.description.trim(),
      assetKey: values.assetKey || null,
      builtInResourceIds: isRoom ? values.builtInResourceIds : [],
    }

    setSaving(true)
    try {
      if (resource) await resourceService.update(resource.id, payload)
      else await resourceService.create(payload)
      toast.success(resource ? text.saved : text.created)
      onSaved()
    } catch (error) {
      const fieldErrors = error.response?.data?.errors
      if (fieldErrors) setErrors(fieldErrors)
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={resource ? text.edit : text.add} onClose={onClose} size="xl">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Name"
            value={values.name}
            onChange={handleChange('name')}
            error={errors.name}
            maxLength={100}
            placeholder={isRoom ? 'Boardroom' : 'Portable projector'}
          />
          {isRoom ? (
            <TextField
              label="Capacity"
              type="number"
              min={1}
              value={values.capacity}
              onChange={handleChange('capacity')}
              error={errors.capacity}
              hint="Number of seats"
            />
          ) : (
            <TextField
              label="Details"
              value={values.facilities}
              onChange={handleChange('facilities')}
              error={errors.facilities}
              placeholder="HDMI cable, Remote"
              hint="Separate items with commas"
            />
          )}
        </div>

        <TextAreaField
          label="Description"
          value={values.description}
          onChange={handleChange('description')}
        />

        {isRoom && (
          <TextField
            label="Other facilities"
            placeholder="Video conferencing, Sound system"
            hint="Things that are not separate resources. Separate items with commas."
            value={values.facilities}
            onChange={handleChange('facilities')}
            error={errors.facilities}
          />
        )}

        <AssetPicker
          kind={kind}
          value={values.assetKey}
          onChange={setField('assetKey')}
          capacity={values.capacity}
          error={errors.assetKey}
        />

        {isRoom && (
          <BuiltInPicker
            roomId={resource?.id}
            value={values.builtInResourceIds}
            onChange={setField('builtInResourceIds')}
            error={errors.builtInResourceIds}
          />
        )}

        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {resource ? 'Save changes' : text.add}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
