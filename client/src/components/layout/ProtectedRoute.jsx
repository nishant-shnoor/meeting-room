import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import PageLoader from '../ui/PageLoader'

export default function ProtectedRoute() {
  const { user, checking } = useAuth()
  const location = useLocation()

  if (checking) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
