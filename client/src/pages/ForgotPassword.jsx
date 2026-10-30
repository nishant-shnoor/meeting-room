import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import authService from '../services/authService'
import getErrorMessage from '../utils/errorMessage'
import { validateEmail } from '../utils/validators'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const emailError = validateEmail(email)

    if (emailError) {
      setError(emailError)
      return
    }

    setSubmitting(true)
    try {
      const response = await authService.forgotPassword(email.trim())
      setMessage(response.message)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
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
            <h1 className="text-xl font-bold text-gray-900">Forgot password</h1>
            <p className="text-sm text-gray-500">
              Your administrator will set a new password for you
            </p>
          </div>

          {message ? (
            <p
              role="status"
              className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800"
            >
              {message}
            </p>
          ) : (
            <>
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError('')
                }}
                error={error}
              />
              <Button type="submit" loading={submitting} className="w-full">
                Request reset
              </Button>
            </>
          )}

          <p className="text-center text-sm text-gray-600">
            <Link to="/login" className="font-medium text-gray-900 underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
