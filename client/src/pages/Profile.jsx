import { useState } from 'react'
import {
  Briefcase,
  Building2,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import authService from '../services/authService'
import getErrorMessage from '../utils/errorMessage'
import { validateProfile, validatePasswordChange } from '../utils/validators'

const valuesFromUser = (user) => ({
  name: user.name ?? '',
  email: user.email ?? '',
  phone: user.phone ?? '',
  department: user.department ?? '',
  jobTitle: user.jobTitle ?? '',
})

function DetailsCard({ user, onSaved }) {
  const toast = useToast()
  const [values, setValues] = useState(() => valuesFromUser(user))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const changed = Object.keys(values).some(
    (key) => values[key] !== (user[key] ?? ''),
  )

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const foundErrors = validateProfile(values)
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length) return

    setSaving(true)
    try {
      const updated = await authService.updateProfile({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        department: values.department.trim(),
        jobTitle: values.jobTitle.trim(),
      })
      onSaved(updated)
      setValues(valuesFromUser(updated))
      toast.success('Profile updated')
    } catch (error) {
      const fieldErrors = error.response?.data?.errors
      if (fieldErrors) setErrors(fieldErrors)
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-line bg-surface shadow-card"
    >
      <div className="border-b border-line p-5">
        <h2 className="text-lg font-bold text-ink">Personal details</h2>
        <p className="text-sm text-muted">
          These details appear next to your bookings.
        </p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <TextField
          label="Full name"
          autoComplete="name"
          value={values.name}
          onChange={handleChange('name')}
          error={errors.name}
          maxLength={100}
        />
        <TextField
          icon={Mail}
          label="Work email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange('email')}
          error={errors.email}
        />
        <TextField
          icon={Phone}
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          value={values.phone}
          onChange={handleChange('phone')}
          error={errors.phone}
          maxLength={30}
        />
        <TextField
          icon={Building2}
          label="Department"
          placeholder="Engineering"
          value={values.department}
          onChange={handleChange('department')}
          error={errors.department}
          maxLength={100}
        />
        <TextField
          icon={Briefcase}
          label="Job title"
          className="sm:col-span-2"
          placeholder="Product designer"
          value={values.jobTitle}
          onChange={handleChange('jobTitle')}
          error={errors.jobTitle}
          maxLength={100}
        />
      </div>
      <div className="flex justify-end gap-3 border-t border-line p-4">
        <Button
          variant="secondary"
          disabled={!changed || saving}
          onClick={() => {
            setValues(valuesFromUser(user))
            setErrors({})
          }}
        >
          Discard changes
        </Button>
        <Button type="submit" loading={saving} disabled={!changed}>
          <Save className="size-4" />
          Save changes
        </Button>
      </div>
    </form>
  )
}

function PasswordCard() {
  const toast = useToast()
  const empty = { currentPassword: '', newPassword: '', confirmPassword: '' }
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const foundErrors = validatePasswordChange(values)
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length) return

    setSaving(true)
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      setValues(empty)
      toast.success('Password updated')
    } catch (error) {
      const fieldErrors = error.response?.data?.errors
      if (fieldErrors) setErrors(fieldErrors)
      else toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="h-fit rounded-2xl border border-line bg-surface shadow-card"
    >
      <div className="border-b border-line p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <KeyRound className="size-5 text-amber" />
          Change password
        </h2>
        <p className="text-sm text-muted">Use at least 8 characters.</p>
      </div>
      <div className="space-y-4 p-5">
        <TextField
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={handleChange('currentPassword')}
          error={errors.currentPassword}
        />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={values.newPassword}
          onChange={handleChange('newPassword')}
          error={errors.newPassword}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={errors.confirmPassword}
        />
      </div>
      <div className="flex justify-end border-t border-line p-4">
        <Button type="submit" loading={saving}>
          Update password
        </Button>
      </div>
    </form>
  )
}

export default function Profile() {
  const { user, updateUser } = useAuth()

  return (
    <>
      <PageHeader title="My profile" subtitle="Keep your details up to date" />

      <section className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl bg-brand p-5 text-white shadow-card dark:text-[#0b0e1c]">
        <Avatar
          name={user.name}
          className="size-16 text-xl ring-4 ring-white/40"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold">{user.name}</p>
          <p className="truncate text-sm opacity-90">
            {[user.jobTitle, user.department].filter(Boolean).join(' at ') ||
              user.email}
          </p>
        </div>
        <span className="flex items-center gap-2">
          <ShieldCheck className="size-5" />
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-[#1f2a8a]">
            {user.role}
          </span>
        </span>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <DetailsCard user={user} onSaved={updateUser} />
        <PasswordCard />
      </div>
    </>
  )
}
