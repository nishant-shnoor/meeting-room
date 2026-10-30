import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import useAuth from '../hooks/useAuth'
import getErrorMessage from '../utils/errorMessage'
import { validateLogin } from '../utils/validators'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', password: '' })
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
    const foundErrors = validateLogin(values)
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length) return

    setSubmitting(true)
    try {
      await login({ email: values.email.trim(), password: values.password })
      navigate(location.state?.from?.pathname || '/', { replace: true })
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
            <h1 className="text-xl font-bold text-gray-900">Sign in</h1>
            <p className="text-sm text-gray-500">Use your work email</p>
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
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange('password')}
            error={errors.password}
          />

          <div className="text-right text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-gray-900 underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            Sign in
          </Button>

          <p className="text-center text-sm text-gray-600">
            No account yet?{' '}
            <Link
              to="/register"
              className="font-medium text-gray-900 underline"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
