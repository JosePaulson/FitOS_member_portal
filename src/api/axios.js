import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: BASE })

// Attach member access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('m_accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Silent token refresh on 401
let refreshing = false
let queue = []

function flush(err, token) {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token)))
  queue = []
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config

    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true

      // If another refresh is already running, wait for it
      if (refreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then((t) => {
            orig.headers.Authorization = `Bearer ${t}`
            return api(orig)
          })
      }

      const rt = localStorage.getItem('m_refreshToken')

      // No refresh token: do NOT reload or redirect, just warn and reject
      if (!rt) {
        flush(new Error('No refresh token'), null)
        return Promise.reject(err)
      }

      refreshing = true

      try {
        const { data } = await axios.post(`${BASE}/member-portal/auth/refresh`, {
          refreshToken: rt,
        })

        localStorage.setItem('m_accessToken', data.accessToken)
        localStorage.setItem('m_refreshToken', data.refreshToken)

        flush(null, data.accessToken)
        orig.headers.Authorization = `Bearer ${data.accessToken}`
        return api(orig)
      } catch (e) {
        flush(e, null)
        localStorage.removeItem('m_accessToken')
        localStorage.removeItem('m_refreshToken')

        // Do not force reload/redirect here
        return Promise.reject(e)
      } finally {
        refreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api