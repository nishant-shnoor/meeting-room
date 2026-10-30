import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
} from 'lucide-react'
import AvailabilityTimeline from './AvailabilityTimeline'
import AddOnPicker from './AddOnPicker'
import Button from '../ui/Button'
import TextField from '../ui/TextField'
import useFetch from '../../hooks/useFetch'
import availabilityService from '../../services/availabilityService'
import {
  buildDurations,
  createSlotChecker,
  describeSlot,
  partOfDay,
  suggestShorterDuration,
} from '../../utils/slots'
import {
  formatDuration,
  formatLongDateKey,
  shiftDateValue,
} from '../../utils/dateTime'
import getErrorMessage from '../../utils/errorMessage'
import cn from '../../utils/cn'

const chipClass = (active, disabled) =>
  cn(
    'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    active
      ? 'border-brand bg-brand text-white dark:text-[#0b0e1c]'
      : 'border-line bg-surface text-ink-soft hover:border-brand hover:bg-brand-soft hover:text-brand-ink',
    disabled && 'cursor-not-allowed opacity-50',
  )

export default function BookingForm({
  resource,
  restrictions,
  equipment,
  initialValues,
  ignoreBookingId,
  submitLabel,
  onSubmit,
}) {
  const navigate = useNavigate()
  const [date, setDate] = useState(initialValues.date)
  const [duration, setDuration] = useState(initialValues.duration)
  const [start, setStart] = useState(initialValues.start)
  const [addOnIds, setAddOnIds] = useState(initialValues.addOnIds)
  const [purpose, setPurpose] = useState(initialValues.purpose)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const candidates = useMemo(
    () => (resource.type === 'room' ? equipment : []),
    [resource.type, equipment],
  )
  const candidateKey = candidates.map((item) => item.id).join(',')

  const loadAvailability = useCallback(
    () =>
      availabilityService.get({
        resourceId: resource.id,
        date,
        addOnIds: candidateKey ? candidateKey.split(',') : [],
        ignoreBookingId,
      }),
    [resource.id, date, candidateKey, ignoreBookingId],
  )

  const { data, loading, error, reload } = useFetch(loadAvailability)

  const rules = data?.rules ?? restrictions
  const durations = useMemo(() => {
    const list = buildDurations(rules)
    return list.includes(duration)
      ? list
      : [...list, duration].sort((a, b) => a - b)
  }, [rules, duration])

  const dataById = useMemo(
    () => new Map((data?.addOns ?? []).map((item) => [item.id, item])),
    [data],
  )
  const selectedAddOns = useMemo(
    () => addOnIds.map((id) => dataById.get(id)).filter(Boolean),
    [addOnIds, dataById],
  )
  const stale = Boolean(data) && data.date !== date

  const checker = useMemo(
    () => (data ? createSlotChecker(data, selectedAddOns) : null),
    [data, selectedAddOns],
  )

  const validStarts = useMemo(
    () =>
      checker
        ? data.grid.filter((point) => checker.check(point.minutes, duration).ok)
        : [],
    [checker, data, duration],
  )

  const selectedResult =
    checker && start !== null ? checker.check(start, duration) : null
  const selection = selectedResult?.ok ? { start, end: start + duration } : null
  const shorter =
    checker && !validStarts.length && data.bookable
      ? suggestShorterDuration(checker, data, durations, duration)
      : undefined

  const changeDate = (next) => {
    setDate(next)
    setStart(null)
    setServerError('')
  }

  const changeDuration = (minutes) => {
    setDuration(minutes)
    setServerError('')
  }

  const pickStart = (minutes) => {
    setStart(minutes)
    setServerError('')
  }

  const toggleAddOn = (id) => {
    setAddOnIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
    setServerError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selection) return
    setSubmitting(true)
    setServerError('')
    try {
      const startTime = new Date(selectedResult.point.iso)
      await onSubmit({
        resourceId: resource.id,
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + duration * 60000).toISOString(),
        purpose: purpose.trim(),
        addOnIds,
      })
    } catch (requestError) {
      setServerError(getErrorMessage(requestError))
      reload()
    } finally {
      setSubmitting(false)
    }
  }

  const rangeStart = data?.isOpen ? Math.floor(data.openMinutes / 60) * 60 : 480
  const rangeEnd = data?.isOpen ? Math.ceil(data.closeMinutes / 60) * 60 : 1200

  const rows = data
    ? [
        {
          key: 'main',
          label: resource.name,
          isMain: true,
          isOpen: data.isOpen,
          openMinutes: data.openMinutes,
          closeMinutes: data.closeMinutes,
          busy: data.busy,
        },
        ...selectedAddOns.map((item) => ({
          key: item.id,
          label: item.name,
          isMain: false,
          isOpen: item.isOpen,
          openMinutes: item.openMinutes,
          closeMinutes: item.closeMinutes,
          busy: item.busy,
        })),
      ]
    : []

  const groups = ['Morning', 'Afternoon', 'Evening']
    .map((name) => ({
      name,
      items: validStarts.filter((point) => partOfDay(point.minutes) === name),
    }))
    .filter((group) => group.items.length)

  const isEdit = submitLabel === 'Save changes'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6"
    >
      <h2 className="text-lg font-bold text-ink">
        {isEdit ? 'Edit booking' : `Book ${resource.name}`}
      </h2>

      <section className="mt-5">
        <h3 className="text-sm font-bold text-ink">1. Pick a day</h3>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <Button
            variant="secondary"
            aria-label="Previous day"
            disabled={!data || date <= data.today}
            onClick={() => changeDate(shiftDateValue(date, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <TextField
            label="Date"
            type="date"
            min={data?.today}
            value={date}
            onChange={(event) =>
              event.target.value && changeDate(event.target.value)
            }
            className="w-44"
          />
          <Button
            variant="secondary"
            aria-label="Next day"
            onClick={() => changeDate(shiftDateValue(date, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
          <p className="flex items-center gap-1.5 pb-2 text-sm text-muted">
            <CalendarDays className="size-4" />
            {formatLongDateKey(date)}
          </p>
        </div>
      </section>

      {error && !data && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl bg-rose-soft p-3 text-sm text-rose-ink"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {data && (
        <div
          className={cn(
            'transition-opacity',
            (loading || stale) && 'opacity-60',
          )}
        >
          <section className="mt-6">
            <h3 className="text-sm font-bold text-ink">2. Choose how long</h3>
            <div
              className="mt-2 flex flex-wrap gap-2"
              role="radiogroup"
              aria-label="Duration"
            >
              {durations.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  role="radio"
                  aria-checked={minutes === duration}
                  onClick={() => changeDuration(minutes)}
                  className={chipClass(minutes === duration)}
                >
                  {formatDuration(minutes)}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-bold text-ink">3. Pick a start time</h3>
            {!data.bookable && (
              <p className="mt-2 flex items-start gap-2 rounded-xl bg-amber-soft p-3 text-sm text-amber-ink">
                <Info className="mt-0.5 size-4 shrink-0" />
                {data.reason}
              </p>
            )}
            {data.bookable && !validStarts.length && (
              <p className="mt-2 flex items-start gap-2 rounded-xl bg-amber-soft p-3 text-sm text-amber-ink">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>
                  No {formatDuration(duration)} slot is free on this day.{' '}
                  {shorter ? (
                    <button
                      type="button"
                      className="font-bold underline"
                      onClick={() => changeDuration(shorter)}
                    >
                      Try {formatDuration(shorter)}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="font-bold underline"
                      onClick={() => changeDate(shiftDateValue(date, 1))}
                    >
                      Check the next day
                    </button>
                  )}
                </span>
              </p>
            )}
            {groups.map((group) => (
              <div key={group.name} className="mt-3">
                <p className="mb-1.5 text-xs font-semibold text-muted">
                  {group.name}
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label={`${group.name} start times`}
                >
                  {group.items.map((point) => (
                    <button
                      key={point.minutes}
                      type="button"
                      role="radio"
                      aria-checked={point.minutes === start}
                      onClick={() => pickStart(point.minutes)}
                      className={chipClass(point.minutes === start)}
                    >
                      {point.time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-sm font-bold text-ink">
              Already booked on this day
            </h3>
            <AvailabilityTimeline
              rows={rows}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              step={rules.slotStepMinutes}
              duration={duration}
              selection={selection}
              checker={checker}
              onPick={pickStart}
              disabled={!data.isOpen}
            />
            {!data.isOpen && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <Clock className="size-4" />
                Closed on this day.
              </p>
            )}
          </section>

          {candidates.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-bold text-ink">
                4. Add resources (optional)
              </h3>
              <p className="mb-2 mt-0.5 text-xs text-muted">
                Projectors, whiteboards and more, booked for the same time as
                the room.
              </p>
              <AddOnPicker
                candidates={candidates}
                selectedIds={addOnIds}
                onToggle={toggleAddOn}
                dataById={dataById}
                slot={
                  selectedResult?.ok
                    ? {
                        point: selectedResult.point,
                        start,
                        end: start + duration,
                      }
                    : null
                }
              />
            </section>
          )}
        </div>
      )}

      <TextField
        className="mt-6"
        label="Purpose (optional)"
        placeholder="Weekly team sync"
        maxLength={255}
        value={purpose}
        onChange={(event) => setPurpose(event.target.value)}
      />

      {selectedResult && !selectedResult.ok && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl bg-rose-soft p-3 text-sm text-rose-ink"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>
            Your chosen time no longer works: {selectedResult.reason}. Pick
            another start time.
          </p>
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl bg-rose-soft p-3 text-sm text-rose-ink"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-sm font-semibold text-ink" aria-live="polite">
          {selection
            ? `${describeSlot(selection.start, duration)} on ${formatLongDateKey(date)}`
            : 'Choose a start time to continue'}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={!selection || loading}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
