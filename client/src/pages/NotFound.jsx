import { Link } from 'react-router-dom'
import buttonClass from '../utils/buttonStyles'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-5xl font-bold text-gray-300">404</p>
      <h1 className="text-xl font-semibold text-gray-900">Page not found</h1>
      <p className="text-sm text-gray-500">
        The page you are looking for does not exist.
      </p>
      <Link to="/resources" className={buttonClass('primary', 'mt-2')}>
        Back to resources
      </Link>
    </div>
  )
}
