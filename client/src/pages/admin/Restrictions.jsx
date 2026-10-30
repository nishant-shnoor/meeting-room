import { useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import QueryState from '../../components/ui/QueryState'
import ResourcePicker from '../../components/admin/ResourcePicker'
import RestrictionsEditor from '../../components/admin/RestrictionsEditor'
import FollowsRoomNotice from '../../components/admin/FollowsRoomNotice'
import useFetch from '../../hooks/useFetch'
import resourceService from '../../services/resourceService'

export default function Restrictions() {
  const {
    data: resources,
    loading,
    error,
    reload,
  } = useFetch(resourceService.listAll)
  const [pickedId, setPickedId] = useState('')
  const resourceId = pickedId || resources?.[0]?.id || ''
  const selected = resources?.find((item) => item.id === resourceId)

  return (
    <>
      <PageHeader
        title="Booking restrictions"
        subtitle="Set the booking rules for a resource"
      />
      <QueryState
        loading={loading && !resources}
        error={error}
        onRetry={reload}
      >
        {resourceId && (
          <div className="space-y-5">
            <ResourcePicker
              resources={resources}
              value={resourceId}
              onChange={setPickedId}
            />
            {selected?.builtInRoom ? (
              <FollowsRoomNotice
                resource={selected}
                what="booking restrictions"
                onOpenRoom={setPickedId}
              />
            ) : (
              <RestrictionsEditor key={resourceId} resourceId={resourceId} />
            )}
          </div>
        )}
      </QueryState>
    </>
  )
}
