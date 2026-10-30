import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import TextField from '../ui/TextField'
import useToast from '../../hooks/useToast'
import userService from '../../services/userService'
import getErrorMessage from '../../utils/errorMessage'

export default function ResetPasswordModal({ employee, onClose }) {
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setSaving(true)
    try {
      await userService.resetPassword(employee.id, password)
      toast.success(`Password changed for ${employee.name}`)
      onClose()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Reset password" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <p className="text-sm text-muted">
          Set a new password for{' '}
          <strong className="text-ink">{employee.name}</strong>. Share it with
          them directly.
        </p>
        <TextField
          label="New password"
          type="text"
          autoComplete="off"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setError('')
          }}
          error={error}
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Change password
          </Button>
        </div>
      </form>
    </Modal>
  )
}
