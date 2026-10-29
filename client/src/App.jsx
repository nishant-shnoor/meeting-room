import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import GuestRoute from './components/layout/GuestRoute'
import ProtectedRoute from './components/layout/ProtectedRoute'
import PageLoader from './components/ui/PageLoader'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Resources = lazy(() => import('./pages/Resources'))
const ResourceDetail = lazy(() => import('./pages/ResourceDetail'))
const BookResource = lazy(() => import('./pages/BookResource'))
const EditBooking = lazy(() => import('./pages/EditBooking'))
const MyBookings = lazy(() => import('./pages/MyBookings'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/resources" replace />} />
            <Route path="resources" element={<Resources />} />
            <Route path="resources/:id" element={<ResourceDetail />} />
            <Route path="resources/:id/book" element={<BookResource />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="bookings/:id/edit" element={<EditBooking />} />
            <Route path="calendar" element={<CalendarPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
