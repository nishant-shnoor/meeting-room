import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthContext from './AuthContext'
import authService from '../services/authService'
import { ROLES, TOKEN_KEY } from '../utils/constants'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    authService
      .getCurrentUser()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    const clearUser = () => setUser(null)
    window.addEventListener('session:expired', clearUser)
    return () => window.removeEventListener('session:expired', clearUser)
  }, [])

  const startSession = useCallback(({ token, user: signedInUser }) => {
    localStorage.setItem(TOKEN_KEY, token)
    setUser(signedInUser)
  }, [])

  const login = useCallback(async (credentials) => startSession(await authService.login(credentials)), [startSession])

  const register = useCallback(async (details) => startSession(await authService.register(details)), [startSession])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, checking, isAdmin: user?.role === ROLES.admin, login, register, logout }),
    [user, checking, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
