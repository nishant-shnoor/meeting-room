export default function FieldShell({
  id,
  label,
  error,
  hint,
  className,
  children,
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-ink-soft"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-message`} className="mt-1 text-xs text-rose-ink">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-message`} className="mt-1 text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
