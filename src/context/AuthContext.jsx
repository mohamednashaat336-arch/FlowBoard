import { useCallback, useMemo, useState } from 'react'
import AuthContext from './authContextValue.js'
import { authenticateUser, readUsers, registerUser, SESSION_KEY, USERS_KEY } from '../services/authService.js'

function readSessionId() {
  try { return window.sessionStorage.getItem(SESSION_KEY) || '' }
  catch { return '' }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(readUsers)
  const [sessionUserId, setSessionUserId] = useState(readSessionId)
  const currentUser = useMemo(() => users.find((user) => user.id === sessionUserId) || null, [users, sessionUserId])

  const saveUsers = useCallback((nextUsers) => {
    try { window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers)) }
    catch { throw new Error('Could not save your account in this browser. Check LocalStorage availability and try again.') }
    setUsers(nextUsers)
  }, [])

  const saveSession = useCallback((userId) => {
    try { window.sessionStorage.setItem(SESSION_KEY, userId) }
    catch { throw new Error('Could not save the current session in this browser. Check session storage availability and try again.') }
    setSessionUserId(userId)
  }, [])

  const register = useCallback(async ({ fullName, email, password, role }) => {
    const result = await registerUser(users, { fullName, email, password, role })
    saveUsers(result.users)
    saveSession(result.user.id)
    return result.user
  }, [users, saveUsers, saveSession])

  const login = useCallback(async ({ email, password }) => {
    const user = await authenticateUser(users, { email, password })
    saveSession(user.id)
    return user
  }, [users, saveSession])

  const logout = useCallback(() => {
    try { window.sessionStorage.removeItem(SESSION_KEY) }
    finally { setSessionUserId('') }
  }, [])

  const value = useMemo(() => ({ currentUser, users, isAuthenticated: Boolean(currentUser), register, login, logout }), [currentUser, users, register, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
