import { Link2 } from 'lucide-react'
import Button from '../ui/Button'

export default function FollowsRoomNotice({ resource, what, onOpenRoom }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-teal bg-teal-soft p-5 text-teal-ink">
      <Link2 className="size-5 shrink-0" />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-bold">{resource.name}</span> is built into{' '}
        <span className="font-bold">{resource.builtInRoom.name}</span>, so it
        always follows that room's {what}. To give it its own, remove it from
        the room's built-in resources first.
      </p>
      <Button
        variant="secondary"
        onClick={() => onOpenRoom(resource.builtInRoom.id)}
      >
        Open {resource.builtInRoom.name}
      </Button>
    </div>
  )
}
