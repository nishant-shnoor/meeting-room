import { useId } from 'react'
import FieldShell from './FieldShell'
import inputClass from '../../utils/fieldStyles'

export default function SelectField({
  label,
  options,
  placeholder,
  error,
  hint,
  className,
  ...selectProps
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
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={inputClass(error)}
        {...selectProps}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
