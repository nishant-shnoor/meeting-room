import cn from '../../utils/cn'

const gradients = [
  'from-indigo-500 to-violet-500',
  'from-teal-500 to-sky-500',
  'from-rose-500 to-orange-400',
  'from-emerald-500 to-teal-500',
  'from-fuchsia-500 to-indigo-500',
  'from-amber-500 to-rose-500',
]

const hashOf = (text) =>
  [...text].reduce((total, char) => total + char.charCodeAt(0), 0)

export const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

export default function Avatar({ name, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white',
        gradients[hashOf(name ?? '') % gradients.length],
        className ?? 'size-9 text-sm',
      )}
    >
      {initialsOf(name)}
    </span>
  )
}
