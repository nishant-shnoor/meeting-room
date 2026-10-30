export default function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-4 py-14 text-center">
      {Icon && (
        <span className="mb-3 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon className="size-7" />
        </span>
      )}
      <h3 className="font-semibold text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
