import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as account from '../api/account'
import { ApiError, getAccessToken, setAccessToken } from '../api/client'

const AuthContext = createContext(null)

function initialsFrom(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'N'
  )
}

/** Adds the display fields the UI wants on top of the API's user record. */
function decorate(user) {
  if (!user) return null
  return {
    ...user,
    initials: initialsFrom(user.name),
    memberSince: user.createdAt ?? new Date().toISOString(),
    tier: user.role === 'admin' ? 'Nova Admin' : 'Nova Member',
  }
}

/** Turns an ApiError into the `{ ok, message, fieldErrors }` shape forms expect. */
function toResult(error) {
  if (error instanceof ApiError) {
    return { ok: false, message: error.message, fieldErrors: error.fieldErrors }
  }
  return {
    ok: false,
    message: 'Could not reach the server. Check your connection and try again.',
    fieldErrors: {},
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isPending, setPending] = useState(false)
  // True until the refresh-cookie check finishes, so guards do not flash.
  const [isRestoring, setRestoring] = useState(true)

  useEffect(() => {
    let active = true

    /**
     * The access token is short-lived, so on load we exchange the httpOnly
     * refresh cookie for a fresh one. A cached token is used first to avoid a
     * visible signed-out flash.
     */
    const restore = async () => {
      try {
        if (getAccessToken()) {
          const current = await account.fetchCurrentUser()
          if (active) setUser(decorate(current))
          return
        }
        const refreshed = await account.restoreSession()
        if (active) setUser(decorate(refreshed))
      } catch {
        if (active) {
          setAccessToken(null)
          setUser(null)
        }
      } finally {
        if (active) setRestoring(false)
      }
    }

    restore()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    setPending(true)
    try {
      const signedIn = await account.login({ email, password })
      setUser(decorate(signedIn))
      return { ok: true, user: decorate(signedIn) }
    } catch (error) {
      return toResult(error)
    } finally {
      setPending(false)
    }
  }, [])

  const signup = useCallback(async ({ name, email, password, newsletterOptIn = false }) => {
    setPending(true)
    try {
      const created = await account.register({ name, email, password, newsletterOptIn })
      setUser(decorate(created))
      return { ok: true, user: decorate(created) }
    } catch (error) {
      return toResult(error)
    } finally {
      setPending(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await account.logout()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      setUser(decorate(await account.fetchCurrentUser()))
    } catch {
      /* leave the current value in place */
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isPending,
      isRestoring,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, isPending, isRestoring, login, signup, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
