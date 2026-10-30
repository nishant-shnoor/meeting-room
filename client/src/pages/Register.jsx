import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import getErrorMessage from '../utils/errorMessage'
import { validateRegister } from '../utils/validators'

export default function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setServerError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const foundErrors = validateRegister(values)
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length) return

    setSubmitting(true)
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      toast.success('Account created')
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
          <CalendarCheck className="size-8" />
          RoomBook
        </div>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create account</h1>
            <p className="text-sm text-gray-500">
              Register with your work email
            </p>
          </div>

          {serverError && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {serverError}
            </p>
          )}

          <TextField
            label="Full name"
            autoComplete="name"
            value={values.name}
            onChange={handleChange('name')}
            error={errors.name}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={values.email}
            onChange={handleChange('email')}
            error={errors.email}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters"
            value={values.password}
            onChange={handleChange('password')}
            error={errors.password}
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={errors.confirmPassword}
          />

          <Button type="submit" loading={submitting} className="w-full">
            Register
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already registered?{' '}
            <Link to="/login" className="font-medium text-gray-900 underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
