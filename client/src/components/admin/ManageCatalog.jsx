import { useMemo, useState } from 'react'
import { Pencil, Plus, Power, Search } from 'lucide-react'
import ResourceFormModal from './ResourceFormModal'
import ResourceImage from '../assets/ResourceImage'
import BuiltInChips from '../catalog/BuiltInChips'
import PageHeader from '../ui/PageHeader'
import QueryState from '../ui/QueryState'
import EmptyState from '../ui/EmptyState'
import StatusBadge from '../ui/StatusBadge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import TextField from '../ui/TextField'
import useFetch from '../../hooks/useFetch'
import useToast from '../../hooks/useToast'
import resourceService from '../../services/resourceService'
import getErrorMessage from '../../utils/errorMessage'
import { resolveAssetKey, resourceAssetMeta } from '../../utils/assets'
import cn from '../../utils/cn'

const copy = {
  room: {
    title: 'Manage meeting rooms',
    subtitle:
      'Rooms people book for meetings. Built-in resources come with the room.',
    add: 'Add meeting room',
    emptyTitle: 'No meeting rooms yet',
    emptyText: 'Add your first room, then choose what is built into it.',
    noun: 'room',
  },
  equipment: {
    title: 'Manage resources',
    subtitle:
      'Projectors, boards, desks and other items. Anyone can add them to a room booking or book them alone.',
    add: 'Add resource',
    emptyTitle: 'No resources yet',
    emptyText: 'Add a projector, whiteboard or anything else people can book.',
    noun: 'resource',
  },
}

export default function ManageCatalog({ kind }) {
  const toast = useToast()
  const isRoom = kind === 'room'
  const text = copy[kind]
  const load = isRoom
    ? resourceService.listAllRooms
    : resourceService.listAllEquipment
  const { data: items, loading, error, reload } = useFetch(load)
  const [search, setSearch] = useState('')
  const [formTarget, setFormTarget] = useState(undefined)
  const [statusTarget, setStatusTarget] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (items ?? []).filter(
      (item) => !term || item.name.toLowerCase().includes(term),
    )
  }, [items, search])

  const handleSaved = () => {
    setFormTarget(undefined)
    reload()
  }

  const handleStatusChange = async () => {
    setUpdatingStatus(true)
    try {
      await resourceService.setActive(statusTarget.id, !statusTarget.isActive)
      toast.success(
        statusTarget.isActive
          ? `${text.noun[0].toUpperCase()}${text.noun.slice(1)} disabled`
          : `${text.noun[0].toUpperCase()}${text.noun.slice(1)} enabled`,
      )
      setStatusTarget(null)
      reload()
    } catch (requestError) {
      toast.error(getErrorMessage(requestError))
    } finally {
      setUpdatingStatus(false)
    }
  }

  const headings = isRoom
    ? ['Room', 'Capacity', 'Built in', 'Status', 'Actions']
    : ['Resource', 'Category', 'Location', 'Status', 'Actions']

  return (
    <>
      <PageHeader title={text.title} subtitle={text.subtitle}>
        <Button onClick={() => setFormTarget(null)}>
          <Plus className="size-4" />
          {text.add}
        </Button>
      </PageHeader>

      {items?.length > 0 && (
        <div className="mb-5 max-w-sm">
          <TextField
            icon={Search}
            label="Search"
            placeholder={`Search ${text.noun}s`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}

      <QueryState loading={loading && !items} error={error} onRetry={reload}>
        {items?.length === 0 ? (
          <EmptyState title={text.emptyTitle} text={text.emptyText}>
            <Button onClick={() => setFormTarget(null)}>{text.add}</Button>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-sunken text-ink-soft">
                <tr>
                  {headings.map((heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      'hover:bg-subtle',
                      !item.isActive && 'opacity-70',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ResourceImage
                          resource={item}
                          className="block h-12 w-20 shrink-0 rounded-lg"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">
                            {item.name}
                          </p>
                          <p className="line-clamp-1 text-xs text-muted">
                            {item.description || item.facilities || ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    {isRoom ? (
                      <>
                        <td className="px-4 py-3 font-semibold text-ink">
                          {item.capacity}
                        </td>
                        <td className="px-4 py-3">
                          {item.builtIn.length ? (
                            <BuiltInChips items={item.builtIn} limit={3} />
                          ) : (
                            <span className="text-faint">None</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-ink-soft">
                          {resourceAssetMeta(resolveAssetKey(item)).label}
                        </td>
                        <td className="px-4 py-3">
                          {item.builtInRoom ? (
                            <span className="rounded-full bg-teal-soft px-2.5 py-1 text-xs font-semibold text-teal-ink">
                              Built into {item.builtInRoom.name}
                            </span>
                          ) : (
                            <span className="text-muted">
                              Bookable on its own
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={item.isActive ? 'active' : 'disabled'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          className="px-2 py-1"
                          onClick={() => setFormTarget(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <Button
                          variant={item.isActive ? 'ghostDanger' : 'ghost'}
                          className="px-2 py-1"
                          onClick={() => setStatusTarget(item)}
                          aria-label={`${item.isActive ? 'Disable' : 'Enable'} ${item.name}`}
                        >
                          <Power className="size-4" />
                          {item.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryState>

      {formTarget !== undefined && (
        <ResourceFormModal
          kind={kind}
          resource={formTarget}
          onClose={() => setFormTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {statusTarget && (
        <ConfirmDialog
          title={
            statusTarget.isActive
              ? `Disable this ${text.noun}?`
              : `Enable this ${text.noun}?`
          }
          message={
            statusTarget.isActive
              ? `${statusTarget.name} will no longer be bookable. Existing bookings are not removed.`
              : `${statusTarget.name} will be bookable again.`
          }
          confirmLabel={statusTarget.isActive ? 'Disable' : 'Enable'}
          danger={statusTarget.isActive}
          loading={updatingStatus}
          onConfirm={handleStatusChange}
          onCancel={() => setStatusTarget(null)}
        />
      )}
    </>
  )
}
