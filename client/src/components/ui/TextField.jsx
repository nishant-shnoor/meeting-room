import { useId } from 'react'
import FieldShell from './FieldShell'
import inputClass from '../../utils/fieldStyles'

export default function TextField({
  label,
  error,
  hint,
  className,
  icon: Icon,
  ...inputProps
}) {
  const id = useId()
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
    >
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        )}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? `${id}-message` : undefined}
          className={inputClass(error) + (Icon ? ' pl-9' : '')}
          {...inputProps}
        />
      </div>
    </FieldShell>
  )
}
