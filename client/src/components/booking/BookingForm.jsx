import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Info } from 'lucide-react'
import BookedTimeline from './BookedTimeline'
import Button from '../ui/Button'
import TextField from '../ui/TextField'
import useFetch from '../../hooks/useFetch'
import bookingService from '../../services/bookingService'
import { BOOKING_STATUS } from '../../utils/constants'
import {
  addDays,
  combineDateTime,
  timeToMinutes,
  todayValue,
} from '../../utils/dateTime'
import { describeOverlap, findOverlap } from '../../utils/booking'
import getErrorMessage from '../../utils/errorMessage'
import { validateBooking } from '../../utils/bookingValidation'

export default function BookingForm({
  resource,
  hours,
  restrictions,
  initialValues,
  ignoreBookingId,
  submitLabel,
  onSubmit,
}) {
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadDayBookings = useCallback(() => {
    if (!values.date) {
      return Promise.resolve([])
    }

    const dayStart = combineDateTime(values.date, '00:00')

    return bookingService.listInRange({
      from: dayStart.toISOString(),
      to: addDays(dayStart, 1).toISOString(),
      resourceId: resource.id,
    })
  }, [values.date, resource.id])

  const { data: dayData } = useFetch(loadDayBookings)

  const dayBookings = useMemo(
    () =>
      (dayData ?? []).filter(
        (booking) =>
          booking.id !== ignoreBookingId &&
          booking.status === BOOKING_STATUS.confirmed,
      ),
    [dayData, ignoreBookingId],
  )

  const selection = useMemo(() => {
    if (!values.date || !values.startTime || !values.endTime) {
      return null
    }

    const start = combineDateTime(values.date, values.startTime)
    const end = combineDateTime(values.date, values.endTime)

    return end > start ? { start, end } : null
  }, [values.date, values.startTime, values.endTime])

  const clash = selection
    ? findOverlap(dayBookings, selection.start, selection.end)
    : null

  const dayHours = useMemo(() => {
    if (!values.date) {
      return null
    }

    return (
      hours.find(
        (row) =>
          row.dayOfWeek === combineDateTime(values.date, '00:00').getDay(),
      ) ?? null
    )
  }, [hours, values.date])

  const timelineStart = dayHours?.isOpen
    ? Math.floor(timeToMinutes(dayHours.openTime) / 60)
    : 8
  const timelineEnd = dayHours?.isOpen
    ? Math.ceil(timeToMinutes(dayHours.closeTime) / 60)
    : 20

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setServerError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const foundErrors = validateBooking(values, { hours, restrictions })
    setErrors(foundErrors)

    if (Object.keys(foundErrors).length || clash) {
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        resourceId: resource.id,
        startTime: selection.start.toISOString(),
        endTime: selection.end.toISOString(),
        purpose: values.purpose.trim(),
      })
    } catch (error) {
      setServerError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const message = serverError || (clash ? describeOverlap(clash) : '')
  const stepSeconds = restrictions.slotStepMinutes * 60

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-gray-200 bg-white p-5"
    >
      <h2 className="text-lg font-semibold text-gray-900">
        {submitLabel === 'Save changes' ? 'Edit booking' : 'Book this resource'}
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <TextField
          label="Date"
          type="date"
          min={todayValue()}
          value={values.date}
          onChange={handleChange('date')}
          error={errors.date}
        />
        <TextField
          label="Start time"
          type="time"
          step={stepSeconds}
          value={values.startTime}
          onChange={handleChange('startTime')}
          error={errors.startTime}
        />
        <TextField
          label="End time"
          type="time"
          step={stepSeconds}
          value={values.endTime}
          onChange={handleChange('endTime')}
          error={errors.endTime}
        />
      </div>

      <TextField
        className="mt-4"
        label="Purpose (optional)"
        placeholder="Weekly team sync"
        maxLength={255}
        value={values.purpose}
        onChange={handleChange('purpose')}
        error={errors.purpose}
      />

      <h3 className="mb-2 mt-6 text-sm font-semibold text-gray-900">
        Already booked on this day
      </h3>
      <BookedTimeline
        bookings={dayBookings}
        startHour={timelineStart}
        endHour={timelineEnd}
        selection={selection}
      />
      {dayHours && !dayHours.isOpen && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Info className="size-4" />
          This resource is closed on the selected day.
        </p>
      )}

      {message && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{message}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} disabled={Boolean(clash)}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
