import { useId } from 'react'
import FieldShell from './FieldShell'
import inputClass from '../../utils/fieldStyles'

export default function TextAreaField({
  label,
  error,
  hint,
  className,
  ...textAreaProps
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
      <textarea
        id={id}
        rows={3}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={inputClass(error)}
        {...textAreaProps}
      />
    </FieldShell>
  )
}
