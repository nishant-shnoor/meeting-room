import { Link } from 'react-router-dom'
import buttonClass from '../utils/buttonStyles'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="bg-gradient-to-r from-brand to-teal bg-clip-text text-6xl font-extrabold text-transparent">
        404
      </p>
      <h1 className="text-xl font-semibold text-ink">Page not found</h1>
      <p className="text-sm text-muted">
        The page you are looking for does not exist.
      </p>
      <Link to="/rooms" className={buttonClass('primary', 'mt-2')}>
        Back to meeting rooms
      </Link>
    </div>
  )
}
