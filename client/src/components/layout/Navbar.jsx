import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CalendarCheck, LogOut, Menu, X } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import cn from '../../utils/cn'

const links = [
  { to: '/resources', label: 'Resources' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/bookings', label: 'My bookings' },
]

const linkClass = ({ isActive }) =>
  cn(
    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-gray-100 text-gray-900'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  )

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const renderLinks = () =>
    links.map((link) => (
      <NavLink
        key={link.to}
        to={link.to}
        className={linkClass}
        onClick={closeMenu}
      >
        {link.label}
      </NavLink>
    ))

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link
          to="/resources"
          className="flex items-center gap-2 font-bold text-gray-900"
        >
          <CalendarCheck className="size-6" />
          RoomBook
        </Link>

        <nav
          className="hidden flex-1 items-center gap-1 md:flex"
          aria-label="Main"
        >
          {renderLinks()}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="text-right text-sm leading-tight">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-xs capitalize text-gray-500">{user.role}</p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Log out"
          >
            <LogOut className="size-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="ml-auto rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {menuOpen && (
        <nav
          className="space-y-1 border-t border-gray-200 px-4 py-3 md:hidden"
          aria-label="Mobile"
        >
          {renderLinks()}

          <div className="flex items-center justify-between border-t border-gray-200 px-3 pt-3 text-sm">
            <span>
              {user.name}{' '}
              <span className="capitalize text-gray-500">({user.role})</span>
            </span>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1 font-medium text-gray-700"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
