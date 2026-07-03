import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/index'

const Ctx = createContext(null)

export function MemberAuthProvider({ children }) {
  const [member, setMember] = useState(null)
  const [gym, setGym] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('m_accessToken')
    if (!token) { setLoading(false); return }
    authApi.me()
      .then(({ data }) => { setMember(data.member); setGym(data.gym) })
      .catch(() => {
        localStorage.removeItem('m_accessToken')
        localStorage.removeItem('m_refreshToken')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (subdomain, phone, pin) => {
    const { data } = await authApi.login({ subdomain, phone, pin })
    localStorage.setItem('m_accessToken', data.accessToken)
    localStorage.setItem('m_refreshToken', data.refreshToken)
    setMember(data.member)
    setGym(data.gym)
    return data
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    localStorage.removeItem('m_accessToken')
    localStorage.removeItem('m_refreshToken')
    setMember(null)
    setGym(null)
  }, [])

  const refreshMember = useCallback(async () => {
    const { data } = await authApi.me()
    setMember(data.member)
    setGym(data.gym)
  }, [])

  return (
    <Ctx.Provider value={{ member, gym, loading, login, logout, refreshMember }}>
      {children}
    </Ctx.Provider>
  )
}

export const useMemberAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMemberAuth must be inside MemberAuthProvider')
  return ctx
}
