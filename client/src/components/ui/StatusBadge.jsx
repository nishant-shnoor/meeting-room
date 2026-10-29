import cn from '../../utils/cn'

const styles = {
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-700',
  completed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  disabled: 'bg-gray-200 text-gray-700',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        styles[status],
      )}
    >
      {status}
    </span>
  )
}
