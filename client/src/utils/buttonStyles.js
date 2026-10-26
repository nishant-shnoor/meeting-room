import cn from './cn'

const variants = {
  primary: 'bg-gray-800 text-white hover:bg-gray-700 focus-visible:outline-gray-800',
  secondary: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 focus-visible:outline-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
  ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-500',
  ghostDanger: 'text-red-600 hover:bg-red-50 focus-visible:outline-red-600',
}

export default function buttonClass(variant = 'primary', extra) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    extra,
  )
}
