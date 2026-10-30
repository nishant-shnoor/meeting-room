import { useMemo, useState } from 'react'
import {
  KeyRound,
  Pencil,
  Power,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import QueryState from '../../components/ui/QueryState'
import EmptyState from '../../components/ui/EmptyState'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SelectField from '../../components/ui/SelectField'
import StatusBadge from '../../components/ui/StatusBadge'
import TextField from '../../components/ui/TextField'
import EmployeeFormModal from '../../components/employees/EmployeeFormModal'
import ResetRequests from '../../components/employees/ResetRequests'
import ResetPasswordModal from '../../components/employees/ResetPasswordModal'
import useAuth from '../../hooks/useAuth'
import useFetch from '../../hooks/useFetch'
import useToast from '../../hooks/useToast'
import userService from '../../services/userService'
import getErrorMessage from '../../utils/errorMessage'
import { formatDate } from '../../utils/dateTime'
import cn from '../../utils/cn'

const roleOptions = [
  { value: 'employee', label: 'Employees' },
  { value: 'admin', label: 'Admins' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Deactivated' },
]

const tones = {
  brand: 'bg-brand-soft text-brand-ink',
  violet: 'bg-violet-soft text-violet-ink',
  green: 'bg-green-soft text-green-ink',
  rose: 'bg-rose-soft text-rose-ink',
}

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <span
        className={cn(
          'grid size-11 place-items-center rounded-xl',
          tones[tone],
        )}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-bold leading-none text-ink">{value}</p>
        <p className="mt-1 text-xs font-medium text-muted">{label}</p>
      </div>
    </div>
  )
}

export default function Employees() {
  const toast = useToast()
  const { user: currentUser } = useAuth()
  const { data: employees, loading, error, reload } = useFetch(userService.list)
  const { data: resetRequests, reload: reloadRequests } = useFetch(
    userService.listResetRequests,
  )
  const [filters, setFilters] = useState({ search: '', role: '', status: '' })
  const [formTarget, setFormTarget] = useState(undefined)
  const [passwordTarget, setPasswordTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const stats = useMemo(() => {
    const list = employees ?? []
    return {
      total: list.length,
      admins: list.filter((item) => item.role === 'admin').length,
      active: list.filter((item) => item.isActive).length,
      inactive: list.filter((item) => !item.isActive).length,
    }
  }, [employees])

  const visible = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return (employees ?? []).filter(
      (item) =>
        (!search ||
          [item.name, item.email, item.department, item.jobTitle].some(
            (field) => (field ?? '').toLowerCase().includes(search),
          )) &&
        (!filters.role || item.role === filters.role) &&
        (!filters.status || (filters.status === 'active') === item.isActive),
    )
  }, [employees, filters])

  const handleChange = (field) => (event) =>
    setFilters((current) => ({ ...current, [field]: event.target.value }))

  const handleSaved = () => {
    setFormTarget(undefined)
    reload()
  }

  const handleStatusChange = async () => {
    setUpdatingStatus(true)
    try {
      await userService.setActive(statusTarget.id, !statusTarget.isActive)
      toast.success(
        statusTarget.isActive ? 'Employee deactivated' : 'Employee reactivated',
      )
      setStatusTarget(null)
      reload()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
      setStatusTarget(null)
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Add people, update their details and control who can sign in"
      >
        <Button onClick={() => setFormTarget(null)}>
          <UserPlus className="size-4" />
          Add employee
        </Button>
      </PageHeader>

      <ResetRequests
        requests={resetRequests ?? []}
        onReset={(request) =>
          setPasswordTarget({ id: request.userId, name: request.name })
        }
        onDismiss={async (request) => {
          try {
            await userService.dismissResetRequest(request.id)
            reloadRequests()
          } catch (requestError) {
            toast.error(getErrorMessage(requestError))
          }
        }}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={Users}
          label="Total people"
          value={stats.total}
          tone="brand"
        />
        <Stat
          icon={ShieldCheck}
          label="Admins"
          value={stats.admins}
          tone="violet"
        />
        <Stat
          icon={UserCheck}
          label="Active"
          value={stats.active}
          tone="green"
        />
        <Stat
          icon={UserX}
          label="Deactivated"
          value={stats.inactive}
          tone="rose"
        />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card sm:grid-cols-3 sm:gap-4">
        <TextField
          className="col-span-2 sm:col-span-1"
          icon={Search}
          label="Search"
          placeholder="Name, email, department"
          value={filters.search}
          onChange={handleChange('search')}
        />
        <SelectField
          label="Role"
          placeholder="Everyone"
          options={roleOptions}
          value={filters.role}
          onChange={handleChange('role')}
        />
        <SelectField
          label="Status"
          placeholder="All"
          options={statusOptions}
          value={filters.status}
          onChange={handleChange('status')}
        />
      </div>

      <QueryState
        loading={loading && !employees}
        error={error}
        onRetry={reload}
      >
        {visible.length === 0 ? (
          <EmptyState
            title="No employees found"
            text="Try changing the filters, or add a new employee."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-sunken text-ink-soft">
                <tr>
                  {[
                    'Employee',
                    'Department',
                    'Role',
                    'Status',
                    'Upcoming',
                    'Joined',
                    'Actions',
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((employee) => {
                  const isSelf = employee.id === currentUser.id
                  return (
                    <tr
                      key={employee.id}
                      className={cn(
                        'hover:bg-subtle',
                        !employee.isActive && 'opacity-70',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={employee.name}
                            className="size-10 text-sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">
                              {employee.name}
                              {isSelf && (
                                <span className="ml-2 text-xs font-medium text-brand">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {employee.email}
                            </p>
                            {employee.phone && (
                              <p className="truncate text-xs text-faint">
                                {employee.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <p className="text-ink-soft">
                          {employee.department || '-'}
                        </p>
                        <p className="text-xs">{employee.jobTitle}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={employee.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={employee.isActive ? 'active' : 'inactive'}
                          label={employee.isActive ? 'Active' : 'Deactivated'}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {employee.upcomingBookings}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatDate(employee.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            className="px-2 py-1"
                            onClick={() => setFormTarget(employee)}
                            aria-label={`Edit ${employee.name}`}
                          >
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            className="px-2 py-1"
                            onClick={() => setPasswordTarget(employee)}
                            aria-label={`Reset password for ${employee.name}`}
                          >
                            <KeyRound className="size-4" />
                            Reset
                          </Button>
                          {!isSelf && (
                            <Button
                              variant={
                                employee.isActive ? 'ghostDanger' : 'ghost'
                              }
                              className="px-2 py-1"
                              onClick={() => setStatusTarget(employee)}
                              aria-label={`${employee.isActive ? 'Deactivate' : 'Reactivate'} ${employee.name}`}
                            >
                              <Power className="size-4" />
                              {employee.isActive ? 'Deactivate' : 'Reactivate'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </QueryState>

      {formTarget !== undefined && (
        <EmployeeFormModal
          employee={formTarget}
          currentUserId={currentUser.id}
          onClose={() => setFormTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {passwordTarget && (
        <ResetPasswordModal
          employee={passwordTarget}
          onClose={() => {
            setPasswordTarget(null)
            reloadRequests()
          }}
        />
      )}

      {statusTarget && (
        <ConfirmDialog
          title={
            statusTarget.isActive
              ? 'Deactivate this employee?'
              : 'Reactivate this employee?'
          }
          message={
            statusTarget.isActive
              ? `${statusTarget.name} will not be able to sign in. Their existing bookings are kept.`
              : `${statusTarget.name} will be able to sign in again.`
          }
          confirmLabel={statusTarget.isActive ? 'Deactivate' : 'Reactivate'}
          danger={statusTarget.isActive}
          loading={updatingStatus}
          onConfirm={handleStatusChange}
          onCancel={() => setStatusTarget(null)}
        />
      )}
    </>
  )
}
