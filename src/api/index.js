import api from './axios'

export const authApi = {
  login: (data) => api.post('/member-portal/auth/login', data),
  refresh: (rt) => api.post('/member-portal/auth/refresh', { refreshToken: rt }),
  logout: () => api.post('/member-portal/auth/logout'),
  me: () => api.get('/member-portal/auth/me'),
  changePin: (data) => api.post('/member-portal/auth/change-pin', data),
}

export const portalApi = {
  me: () => api.get('/member-portal/me'),
  plans: () => api.get('/member-portal/plans'),
  invoices: (params = {}) => api.get('/member-portal/invoices', { params }),
  invoice: (id) => api.get(`/member-portal/invoices/${id}`),
  attendance: (params = {}) => api.get('/member-portal/attendance', { params }),
  attendanceSummary: () => api.get('/member-portal/attendance/summary'),

  // PT Sessions — dedicated routes
  ptSessions: (params = {}) => api.get('/member-portal/pt-sessions', { params }),
  ptSession: (id) => api.get(`/member-portal/pt-sessions/${id}`),
  ptProgress: () => api.get('/member-portal/pt-sessions/progress/body-weight'),
  ptAcknowledge: (id) => api.post(`/member-portal/pt-sessions/${id}/acknowledge`),
  ptTrainers: () => api.get('/member-portal/pt-sessions/trainers'),
  ptRequest: (data) => api.post('/member-portal/pt-sessions/request', data),
  ptCancel: (id) => api.post(`/member-portal/pt-sessions/${id}/cancel`),
  equipment: (params = {}) => api.get('/member-portal/equipment', { params }),

  workoutPlans: () => api.get('/member-portal/workout-plans'),
  workoutPlan: (id) => api.get(`/member-portal/workout-plans/${id}`),
  dietPlans: () => api.get('/member-portal/diet-plans'),
  dietPlan: (id) => api.get(`/member-portal/diet-plans/${id}`),
}

export const chatApi = {
  send: (messages) => api.post('/member-portal/chat', { messages }),
  suggestions: () => api.get('/member-portal/chat/suggestions'),
}

export const pushApi = {
  vapidPublicKey: () => api.get('/member-portal/push/vapid-public-key'),
  subscribe: (subscription) => api.post('/member-portal/push/subscribe', subscription),
  unsubscribe: (endpoint) => api.post('/member-portal/push/unsubscribe', { endpoint }),
}
