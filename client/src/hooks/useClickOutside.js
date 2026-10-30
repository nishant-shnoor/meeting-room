import { useEffect } from 'react'

export default function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined

    const listen = (event) => {
      if (event.type === 'keydown') {
        if (event.key === 'Escape') handler()
        return
      }
      if (ref.current && !ref.current.contains(event.target)) handler()
    }

    document.addEventListener('mousedown', listen)
    document.addEventListener('keydown', listen)
    return () => {
      document.removeEventListener('mousedown', listen)
      document.removeEventListener('keydown', listen)
    }
  }, [ref, handler, active])
}
