import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/resources'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [officer, setOfficer] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setOfficer(null)
      setLoading(false)
      return
    }
    try {
      const res = await authApi.me()
      setOfficer(res.data)
    } catch {
      localStorage.removeItem('access_token')
      setOfficer(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  const login = async (token) => {
    localStorage.setItem('access_token', token)
    await loadMe()
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore — stateless JWT, local removal is what matters
    }
    localStorage.removeItem('access_token')
    setOfficer(null)
  }

  return (
    <AuthContext.Provider value={{ officer, loading, login, logout, refresh: loadMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
