import useAuth from '../hooks/useAuth'

export default function Home() {
  const { logout } = useAuth()

  return (
    <div>
      <span>Logged in</span> <button onClick={logout} className="rounded-sm border border-gray-500 bg-gray-200 px-2 py-0.5 hover:bg-gray-300">Logout</button>
    </div>
  )
}
 