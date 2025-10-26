import { useEffect, useState } from 'react'
import { Login } from './Login'
import { Dashboard } from './Dashboard'
import { api } from '../lib/api'
import type { User } from '../types'

export const App = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/auth/me')
        setUser(data?.user ?? null)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="container py-10 text-center">Loading…</div>

  if (!user) {
    // ✅ Fix: wrap setUser to accept AuthResponse from Login
    return <Login onLoggedIn={(resp) => setUser(resp.user ?? null)} />
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />
}
