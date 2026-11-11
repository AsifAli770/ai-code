import { useCallback, useEffect, useMemo, useState } from 'react'
import { UNAUTHORIZED_EVENT } from '../services/api'
import * as authService from '../services/auth.service'
import { TOKEN_KEY, tokenStorage } from '../utils/storage'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // True while we check a stored token on first load, so protected
  // routes don't flash the login page before the session is restored.
  const [initializing, setInitializing] = useState(() => Boolean(tokenStorage.get()))

  // Restore the session from a stored token.
  useEffect(() => {
    if (!tokenStorage.get()) return
    let cancelled = false
    authService
      .fetchCurrentUser()
      .then((u) => !cancelled && setUser(u))
      .catch(() => {
        if (!cancelled) {
          tokenStorage.clear()
          setUser(null)
        }
      })
      .finally(() => !cancelled && setInitializing(false))
    return () => {
      cancelled = true
    }
  }, [])

  // Any 401 from the API (expired/invalid token) logs the user out.
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  // Keep tabs in sync. All tabs share one token in localStorage, so when
  // another tab logs in as someone else or logs out, this tab must follow;
  // otherwise it would show one user while sending another user's token.
  // The `storage` event fires only in the OTHER tabs, never the one that wrote.
  useEffect(() => {
    let requestId = 0
    const onStorage = (e) => {
      if (e.key !== TOKEN_KEY && e.key !== null) return // null = storage cleared
      const id = ++requestId
      if (!tokenStorage.get()) {
        setUser(null)
        return
      }
      authService
        .fetchCurrentUser()
        .then((u) => id === requestId && setUser(u))
        .catch(() => id === requestId && setUser(null))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback(async (credentials) => {
    const { user: u, token } = await authService.login(credentials)
    tokenStorage.set(token)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (details) => {
    const { user: u, token } = await authService.register(details)
    tokenStorage.set(token)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    // JWTs are stateless: logging out means discarding the token client-side.
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      initializing,
      login,
      register,
      logout,
    }),
    [user, initializing, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
