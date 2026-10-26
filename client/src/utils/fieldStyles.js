import cn from './cn'

export default function inputClass(hasError) {
  return cn(
    'w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-800 focus:ring-1 focus:ring-gray-800 disabled:bg-gray-100 disabled:text-gray-500',
    hasError ? 'border-red-500' : 'border-gray-300',
  )
}
