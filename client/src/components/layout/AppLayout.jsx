import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import PageLoader from '../ui/PageLoader'

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:py-8 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
