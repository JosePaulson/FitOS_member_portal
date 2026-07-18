import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/index'
import { readCache, writeCache, isNetworkError } from '../lib/offline'

const Ctx = createContext(null)

export function MemberAuthProvider({ children }) {
  // Seed from the last-known-good cache synchronously so a page reload while
  // offline still renders the app instead of bouncing to /login.
  const [member, setMember] = useState(() => readCache('auth:member'))
  const [gym, setGym] = useState(() => readCache('auth:gym'))
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  const verifySession = useCallback(async () => {
    try {
      const { data } = await authApi.me()
      setMember(data.member)
      setGym(data.gym)
      writeCache('auth:member', data.member)
      writeCache('auth:gym', data.gym)
      setIsOffline(false)
    } catch (err) {
      if (isNetworkError(err)) {
        // Offline / server unreachable — NOT an invalid session. Keep
        // whatever member/gym we already have (from cache or memory) and
        // the stored tokens, so the member stays logged in and can keep
        // using cached data until connectivity returns.
        setIsOffline(true)
        return
      }
      const status = err.response?.status
      if (status !== 401 && status !== 403) {
        // Some other server-side error (429 rate-limited, 500, etc.) — not
        // proof the session is invalid. Leave the member logged in; the
        // global rate-limit warning (see axios.js) covers 429 specifically.
        return
      }
      // The server explicitly rejected the session (401/403) — this is the
      // one case where logging out is correct.
      localStorage.removeItem('m_accessToken')
      localStorage.removeItem('m_refreshToken')
      writeCache('auth:member', null)
      writeCache('auth:gym', null)
      setMember(null)
      setGym(null)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('m_accessToken')
    if (!token) { setLoading(false); return }
    verifySession().finally(() => setLoading(false))
  }, [verifySession])

  // As soon as the browser regains connectivity, silently re-verify the
  // session and refresh cached data — no action needed from the member.
  useEffect(() => {
    function onOnline() {
      if (localStorage.getItem('m_accessToken')) verifySession()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [verifySession])

  const login = useCallback(async (subdomain, phone, pin) => {
    const { data } = await authApi.login({ subdomain, phone, pin })
    localStorage.setItem('m_accessToken', data.accessToken)
    localStorage.setItem('m_refreshToken', data.refreshToken)
    setMember(data.member)
    setGym(data.gym)
    writeCache('auth:member', data.member)
    writeCache('auth:gym', data.gym)
    setIsOffline(false)
    return data
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore — still log out locally */ }
    localStorage.removeItem('m_accessToken')
    localStorage.removeItem('m_refreshToken')
    writeCache('auth:member', null)
    writeCache('auth:gym', null)
    setMember(null)
    setGym(null)
  }, [])

  const refreshMember = useCallback(async () => {
    const { data } = await authApi.me()
    setMember(data.member)
    setGym(data.gym)
    writeCache('auth:member', data.member)
    writeCache('auth:gym', data.gym)
  }, [])

  return (
    <Ctx.Provider value={{ member, gym, loading, isOffline, login, logout, refreshMember }}>
      {children}
    </Ctx.Provider>
  )
}

export const useMemberAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMemberAuth must be inside MemberAuthProvider')
  return ctx
}
