import { useMemo, useState } from 'react'
import { DEMO_USERS } from './roles'
import { setAuthToken } from '../api/client'
import { AuthContext } from './context'

const STORAGE_KEY = 'railoptix-demo-session'

function readSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') } catch { return null }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const loginAsDemo = (userId, department) => {
    const user = DEMO_USERS.find((candidate) => candidate.id === userId)
    if (!user) return
    const nextSession = { ...user, department: department || user.department, isDemo: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession)); setSession(nextSession); setAuthToken(null)
  }
  const logout = () => { localStorage.removeItem(STORAGE_KEY); setSession(null); setAuthToken(null) }
  const value = useMemo(() => ({ session, isAuthenticated: Boolean(session), loginAsDemo, logout }), [session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

