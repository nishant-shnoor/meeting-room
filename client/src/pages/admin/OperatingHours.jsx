import { useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import QueryState from '../../components/ui/QueryState'
import ResourcePicker from '../../components/admin/ResourcePicker'
import HoursEditor from '../../components/admin/HoursEditor'
import FollowsRoomNotice from '../../components/admin/FollowsRoomNotice'
import useFetch from '../../hooks/useFetch'
import resourceService from '../../services/resourceService'

export default function OperatingHours() {
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
        title="Operating hours"
        subtitle="Set the hours when a resource can be booked"
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
                what="operating hours"
                onOpenRoom={setPickedId}
              />
            ) : (
              <HoursEditor key={resourceId} resourceId={resourceId} />
            )}
          </div>
        )}
      </QueryState>
    </>
  )
}
