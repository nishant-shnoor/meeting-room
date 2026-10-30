import cn from '../../utils/cn'

const styles = {
  confirmed: 'bg-green-soft text-green-ink',
  cancelled: 'bg-sunken text-muted',
  completed: 'bg-sky-soft text-sky-ink',
  active: 'bg-green-soft text-green-ink',
  disabled: 'bg-sunken text-muted',
  inactive: 'bg-rose-soft text-rose-ink',
  admin: 'bg-violet-soft text-violet-ink',
  employee: 'bg-sky-soft text-sky-ink',
}

export default function StatusBadge({ status, label }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        styles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label ?? status}
    </span>
  )
}
