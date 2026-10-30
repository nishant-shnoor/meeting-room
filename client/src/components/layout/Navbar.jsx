import { useCallback, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  DoorOpen,
  LogOut,
  Menu,
  Boxes,
  ShieldCheck,
  ClipboardList,
  X,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import useClickOutside from '../../hooks/useClickOutside'
import Avatar from '../ui/Avatar'
import Logo from '../ui/Logo'
import StatusBadge from '../ui/StatusBadge'
import cn from '../../utils/cn'

const memberLinks = [
  { to: '/rooms', label: 'Meeting rooms', icon: DoorOpen },
  { to: '/resources', label: 'Resources', icon: Boxes },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/bookings', label: 'My bookings', icon: ClipboardList },
]

const adminLinks = [
  { to: '/admin/rooms', label: 'Manage rooms' },
  { to: '/admin/resources', label: 'Manage resources' },
  { to: '/admin/employees', label: 'Employees' },
  { to: '/admin/bookings', label: 'All bookings' },
  { to: '/admin/hours', label: 'Operating hours' },
  { to: '/admin/restrictions', label: 'Restrictions' },
]

const linkClass = ({ isActive }) =>
  cn(
    'block rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-brand-soft text-brand-ink'
      : 'text-muted hover:bg-sunken hover:text-ink',
  )

const menuItemClass = ({ isActive }) =>
  cn(
    'block rounded-lg px-3 py-2 text-sm font-medium',
    isActive ? 'bg-brand-soft text-brand-ink' : 'text-ink-soft hover:bg-sunken',
  )

function Dropdown({
  label,
  icon: Icon,
  active,
  children,
  align = 'left',
  buttonContent,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close, open)

  return (
    <div
      ref={ref}
      className="relative"
      onClick={(event) =>
        event.target.closest('a,button[data-close]') && close()
      }
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
          active || open
            ? 'bg-brand-soft text-brand-ink'
            : 'text-muted hover:bg-sunken hover:text-ink',
        )}
      >
        {buttonContent ?? (
          <>
            {Icon && <Icon className="size-4" />}
            {label}
          </>
        )}
        <ChevronDown
          className={cn('size-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-40 mt-2 w-60 rounded-xl border border-line bg-surface p-1.5 shadow-xl',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

const tabClass = ({ isActive }) =>
  cn(
    'flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand',
    isActive ? 'text-brand-ink' : 'text-muted hover:text-ink',
  )

function MobileTabs({ user, isAdmin, logout }) {
  const location = useLocation()
  const [sheetOpen, setSheetOpen] = useState(false)
  const closeSheet = () => setSheetOpen(false)
  const moreActive =
    sheetOpen ||
    location.pathname === '/profile' ||
    location.pathname.startsWith('/admin')

  return (
    <>
      {sheetOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={closeSheet}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            role="menu"
            className="absolute inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface p-3 shadow-xl sm:mx-auto sm:max-w-md sm:rounded-2xl sm:border"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-2 pb-3">
              <Avatar name={user.name} className="size-10 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <StatusBadge status={user.role} />
            </div>
            <div className="pt-2">
              <NavLink
                to="/profile"
                className={menuItemClass}
                role="menuitem"
                onClick={closeSheet}
              >
                My profile
              </NavLink>
              {isAdmin && (
                <>
                  <p className="px-3 pb-1 pt-3 text-xs font-semibold text-faint">
                    Admin
                  </p>
                  {adminLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={menuItemClass}
                      role="menuitem"
                      onClick={closeSheet}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </>
              )}
              <button
                type="button"
                onClick={logout}
                role="menuitem"
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-ink hover:bg-rose-soft"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Main"
      >
        {memberLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={tabClass}
            aria-label={label}
            title={label}
            onClick={closeSheet}
          >
            <Icon className="size-6" />
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setSheetOpen((open) => !open)}
          aria-label="More"
          title="More"
          aria-expanded={sheetOpen}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand',
            moreActive ? 'text-brand-ink' : 'text-muted hover:text-ink',
          )}
        >
          {sheetOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>
    </>
  )
}

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()
  const adminActive = location.pathname.startsWith('/admin')

  const renderLinks = (links) =>
    links.map((link) => (
      <NavLink key={link.to} to={link.to} className={linkClass}>
        {link.label}
      </NavLink>
    ))

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <Link
            to="/rooms"
            className="mr-2 rounded-lg focus-visible:outline-2 focus-visible:outline-brand"
            aria-label="RoomBook home"
          >
            <Logo />
          </Link>

          <nav
            className="hidden flex-1 items-center gap-1 lg:flex"
            aria-label="Main"
          >
            {renderLinks(memberLinks)}
            {isAdmin && (
              <Dropdown label="Admin" icon={ShieldCheck} active={adminActive}>
                {adminLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={menuItemClass}
                    role="menuitem"
                  >
                    {link.label}
                  </NavLink>
                ))}
              </Dropdown>
            )}
          </nav>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <Dropdown
              label="Account menu"
              align="right"
              buttonContent={
                <>
                  <Avatar name={user.name} className="size-7 text-xs" />
                  <span className="max-w-32 truncate">{user.name}</span>
                </>
              }
            >
              <div className="flex items-center gap-3 border-b border-line px-3 py-2.5">
                <Avatar name={user.name} className="size-10 text-sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                  <div className="mt-1">
                    <StatusBadge status={user.role} />
                  </div>
                </div>
              </div>
              <div className="pt-1.5">
                <NavLink
                  to="/profile"
                  className={menuItemClass}
                  role="menuitem"
                >
                  My profile
                </NavLink>
                <button
                  type="button"
                  data-close
                  onClick={logout}
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-ink hover:bg-rose-soft"
                >
                  <LogOut className="size-4" />
                  Log out
                </button>
              </div>
            </Dropdown>
          </div>

          <div className="ml-auto lg:hidden"></div>
        </div>
      </header>
      <MobileTabs user={user} isAdmin={isAdmin} logout={logout} />
    </>
  )
}
