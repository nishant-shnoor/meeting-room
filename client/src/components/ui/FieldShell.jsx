export default function FieldShell({ id, label, error, hint, className, children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-message`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-message`} className="mt-1 text-xs text-gray-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
