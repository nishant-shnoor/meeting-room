import { Loader2 } from 'lucide-react'

export default function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500" role="status">
      <Loader2 className="size-5 animate-spin" />
      {label}
    </div>
  )
}
