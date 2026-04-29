import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const stored = localStorage.getItem('registry_user')
    if (stored) { try { setUser(JSON.parse(stored)) } catch (_) {} }
    setLoading(false)
  }, [])
  const login = async (userId, password) => {
    const { data, error } = await supabase
      .from('users').select('*, roles(name)')
      .eq('user_id', userId).eq('password', password).eq('is_active', true).single()
    if (error || !data) throw new Error('Identifiant ou mot de passe incorrect')
    const userInfo = { id: data.id, userId: data.user_id, fullName: data.full_name, role: data.roles?.name ?? 'agent' }
    setUser(userInfo)
    localStorage.setItem('registry_user', JSON.stringify(userInfo))
    return userInfo
  }
  const logout = () => { setUser(null); localStorage.removeItem('registry_user') }
  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
