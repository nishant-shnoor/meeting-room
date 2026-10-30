import { Check } from 'lucide-react'
import ResourceImage from '../assets/ResourceImage'
import {
  RESOURCE_ASSETS,
  ROOM_ASSETS,
  roomAssetForCapacity,
} from '../../utils/assets'
import cn from '../../utils/cn'

export default function AssetPicker({
  kind,
  value,
  onChange,
  capacity,
  error,
}) {
  const isRoom = kind === 'room'
  const options = isRoom
    ? [
        {
          key: '',
          label: 'Match the capacity',
          hint: 'Picked automatically',
          preview: roomAssetForCapacity(capacity),
        },
        ...ROOM_ASSETS.map((asset) => ({ ...asset, preview: asset.key })),
      ]
    : RESOURCE_ASSETS.map((asset) => ({ ...asset, preview: asset.key }))

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-ink-soft">
        {isRoom ? 'Room picture' : 'Category and picture'}
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = (value ?? '') === option.key
          return (
            <label
              key={option.key || 'auto'}
              className={cn(
                'relative cursor-pointer overflow-hidden rounded-xl border-2 bg-surface transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand',
                selected
                  ? 'border-brand'
                  : 'border-line hover:border-line-strong',
              )}
            >
              <input
                type="radio"
                name={`${kind}-asset`}
                value={option.key}
                checked={selected}
                onChange={() => onChange(option.key)}
                className="sr-only"
              />
              <ResourceImage
                type={isRoom ? 'room' : 'equipment'}
                assetKey={option.preview}
                className="block aspect-[16/9] w-full"
              />
              <span className="block px-2 py-1.5 text-xs font-semibold text-ink">
                {option.label}
              </span>
              {selected && (
                <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-brand text-white shadow dark:text-[#0b0e1c]">
                  <Check className="size-3.5" />
                </span>
              )}
            </label>
          )
        })}
      </div>
      {error && <p className="mt-1 text-xs text-rose-ink">{error}</p>}
    </fieldset>
  )
}
