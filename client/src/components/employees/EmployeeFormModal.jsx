import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import TextField from '../ui/TextField'
import SelectField from '../ui/SelectField'
import useToast from '../../hooks/useToast'
import userService from '../../services/userService'
import getErrorMessage from '../../utils/errorMessage'
import { validateEmployee } from '../../utils/validators'

const roleOptions = [
  { value: 'employee', label: 'Employee' },
  { value: 'admin', label: 'Admin' },
]

const emptyValues = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  phone: '',
  department: '',
  jobTitle: '',
}

const valuesFrom = (employee) => ({
  name: employee.name,
  email: employee.email,
  password: '',
  role: employee.role,
  phone: employee.phone ?? '',
  department: employee.department ?? '',
  jobTitle: employee.jobTitle ?? '',
})

export default function EmployeeFormModal({
  employee,
  currentUserId,
  onClose,
  onSaved,
}) {
  const toast = useToast()
  const isEdit = Boolean(employee)
  const [values, setValues] = useState(
    employee ? valuesFrom(employee) : emptyValues,
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const foundErrors = validateEmployee(values, { requirePassword: !isEdit })
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length) return

    const details = {
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
      phone: values.phone.trim(),
      department: values.department.trim(),
      jobTitle: values.jobTitle.trim(),
    }

    setSaving(true)
    try {
      if (isEdit) await userService.update(employee.id, details)
      else await userService.create({ ...details, password: values.password })
      toast.success(isEdit ? 'Employee updated' : 'Employee added')
      onSaved()
    } catch (error) {
      const fieldErrors = error.response?.data?.errors
      if (fieldErrors) setErrors(fieldErrors)
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const isSelf = employee?.id === currentUserId

  return (
    <Modal
      title={isEdit ? 'Edit employee' : 'Add employee'}
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Full name"
            value={values.name}
            onChange={handleChange('name')}
            error={errors.name}
            maxLength={100}
          />
          <TextField
            label="Work email"
            type="email"
            value={values.email}
            onChange={handleChange('email')}
            error={errors.email}
          />
          <TextField
            label="Phone"
            type="tel"
            value={values.phone}
            onChange={handleChange('phone')}
            error={errors.phone}
            maxLength={30}
          />
          <SelectField
            label="Role"
            options={roleOptions}
            value={values.role}
            onChange={handleChange('role')}
            error={errors.role}
            disabled={isSelf}
            hint={isSelf ? 'You cannot change your own role' : undefined}
          />
          <TextField
            label="Department"
            value={values.department}
            onChange={handleChange('department')}
            error={errors.department}
            maxLength={100}
          />
          <TextField
            label="Job title"
            value={values.jobTitle}
            onChange={handleChange('jobTitle')}
            error={errors.jobTitle}
            maxLength={100}
          />
        </div>
        {!isEdit && (
          <TextField
            label="Starting password"
            type="text"
            autoComplete="off"
            hint="Share it with the employee. They can change it from their profile."
            value={values.password}
            onChange={handleChange('password')}
            error={errors.password}
          />
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save changes' : 'Add employee'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
