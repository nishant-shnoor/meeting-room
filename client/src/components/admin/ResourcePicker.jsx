import { useId } from 'react'
import FieldShell from '../ui/FieldShell'
import inputClass from '../../utils/fieldStyles'

export default function ResourcePicker({ resources, value, onChange }) {
  const id = useId()
  const rooms = resources.filter((resource) => resource.type === 'room')
  const others = resources.filter((resource) => resource.type !== 'room')

  return (
    <FieldShell
      id={id}
      label="Meeting room or resource"
      className="w-full sm:w-80"
    >
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(false)}
      >
        {rooms.length > 0 && (
          <optgroup label="Meeting rooms">
            {rooms.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </optgroup>
        )}
        {others.length > 0 && (
          <optgroup label="Resources">
            {others.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </FieldShell>
  )
}
