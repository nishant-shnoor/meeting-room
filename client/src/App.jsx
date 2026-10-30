import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import GuestRoute from './components/layout/GuestRoute'
import ProtectedRoute from './components/layout/ProtectedRoute'
import PageLoader from './components/ui/PageLoader'
import { ROLES } from './utils/constants'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Catalog = lazy(() => import('./pages/Catalog'))
const Profile = lazy(() => import('./pages/Profile'))
const BookResource = lazy(() => import('./pages/BookResource'))
const EditBooking = lazy(() => import('./pages/EditBooking'))
const MyBookings = lazy(() => import('./pages/MyBookings'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const ManageRooms = lazy(() => import('./pages/admin/ManageRooms'))
const ManageResources = lazy(() => import('./pages/admin/ManageResources'))
const Employees = lazy(() => import('./pages/admin/Employees'))
const OperatingHours = lazy(() => import('./pages/admin/OperatingHours'))
const Restrictions = lazy(() => import('./pages/admin/Restrictions'))
const AllBookings = lazy(() => import('./pages/admin/AllBookings'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/rooms" replace />} />
            <Route path="rooms" element={<Catalog kind="room" />} />
            <Route path="rooms/:id/book" element={<BookResource />} />
            <Route path="resources" element={<Catalog kind="equipment" />} />
            <Route path="resources/:id/book" element={<BookResource />} />
            <Route path="profile" element={<Profile />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="bookings/:id/edit" element={<EditBooking />} />
            <Route path="calendar" element={<CalendarPage />} />

            <Route element={<ProtectedRoute roles={[ROLES.admin]} />}>
              <Route path="admin/rooms" element={<ManageRooms />} />
              <Route path="admin/resources" element={<ManageResources />} />
              <Route path="admin/employees" element={<Employees />} />
              <Route path="admin/hours" element={<OperatingHours />} />
              <Route path="admin/restrictions" element={<Restrictions />} />
              <Route path="admin/bookings" element={<AllBookings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
