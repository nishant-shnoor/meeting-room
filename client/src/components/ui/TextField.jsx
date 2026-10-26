import { useId } from 'react'
import FieldShell from './FieldShell'
import inputClass from '../../utils/fieldStyles'

export default function TextField({ label, error, hint, className, ...inputProps }) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={inputClass(error)}
        {...inputProps}
      />
    </FieldShell>
  )
}
