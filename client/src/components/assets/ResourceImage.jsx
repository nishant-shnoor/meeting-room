import {
  ROOM_ASSETS,
  resolveAssetKey,
  resourceAssetMeta,
} from '../../utils/assets'
import cn from '../../utils/cn'

export default function ResourceImage({ resource, assetKey, type, className }) {
  const kind = type ?? resource?.type
  const key = assetKey ?? resolveAssetKey(resource)
  const isRoom = kind === 'room'
  const folder = isRoom ? 'rooms' : 'resources'
  const label = isRoom
    ? (ROOM_ASSETS.find((asset) => asset.key === key)?.label ?? 'Meeting room')
    : resourceAssetMeta(key).label

  return (
    <img
      src={`/images/${folder}/${key}.png`}
      alt={label}
      loading="lazy"
      className={cn('object-cover', className)}
    />
  )
}
