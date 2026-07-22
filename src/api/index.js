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
  updateProfile: (data) => api.patch('/member-portal/me', data),
  uploadPhoto: (file) => {
    const form = new FormData()
    form.append('image', file)
    return api.post('/member-portal/me/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  removePhoto: () => api.delete('/member-portal/me/photo'),
  plans: () => api.get('/member-portal/plans'),
  invoices: (params = {}) => api.get('/member-portal/invoices', { params }),
  invoice: (id) => api.get(`/member-portal/invoices/${id}`),
  attendance: (params = {}) => api.get('/member-portal/attendance', { params }),
  attendanceSummary: () => api.get('/member-portal/attendance/summary'),

  // PT Sessions — dedicated routes
  ptSessions: (params = {}) => api.get('/member-portal/pt-sessions', { params }),
  ptSession: (id) => api.get(`/member-portal/pt-sessions/${id}`),
  ptProgress: () => api.get('/member-portal/pt-sessions/progress/body-weight'),
  ptPlans: () => api.get('/member-portal/pt-plans'),
  ptPlanCatalog: () => api.get('/member-portal/pt-plans/catalog'),

  // Geofenced self check-in
  attendanceToday: () => api.get('/member-portal/attendance/today'),
  attendanceCheckin: (lat, lng) => api.post('/member-portal/attendance/checkin', { lat, lng }),

  // Self-logged workouts (member's own gym-session log, separate from assigned plans)
  logWorkout: (data) => api.post('/member-portal/workout-logs', data),
  workoutLogs: (params = {}) => api.get('/member-portal/workout-logs', { params }),
  workoutLog: (id) => api.get(`/member-portal/workout-logs/${id}`),
  updateWorkoutLog: (id, data) => api.patch(`/member-portal/workout-logs/${id}`, data),
  deleteWorkoutLog: (id) => api.delete(`/member-portal/workout-logs/${id}`),
  bodyWeightProgress: () => api.get('/member-portal/workout-logs/progress/body-weight'),
  ptAcknowledge: (id) => api.post(`/member-portal/pt-sessions/${id}/acknowledge`),
  ptTrainers: () => api.get('/member-portal/pt-sessions/trainers'),
  ptAvailableSlots: (trainerId, date) => api.get('/member-portal/pt-sessions/available-slots', { params: { trainerId, date } }),
  ptRequest: (data) => api.post('/member-portal/pt-sessions/request', data),
  ptCancel: (id) => api.post(`/member-portal/pt-sessions/${id}/cancel`),
  equipment: (params = {}) => api.get('/member-portal/equipment', { params }),

  workoutPlans: () => api.get('/member-portal/workout-plans'),
  workoutPlan: (id) => api.get(`/member-portal/workout-plans/${id}`),
  dietPlans: () => api.get('/member-portal/diet-plans'),
  dietPlan: (id) => api.get(`/member-portal/diet-plans/${id}`),

  // AI food scanner — "Scan Meal"
  scanMeal: (file) => {
    const form = new FormData()
    form.append('image', file)
    return api.post('/member-portal/food-scan', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  foodScanHistory: (params = {}) => api.get('/member-portal/food-scan', { params }),
  foodScan: (id) => api.get(`/member-portal/food-scan/${id}`),
  deleteFoodScan: (id) => api.delete(`/member-portal/food-scan/${id}`),
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

/* ── Payments (Razorpay: membership renewals/switches, PT plans, invoices) ── */
export const paymentApi = {
  config: () => api.get('/member-portal/payments/config'),
  payInvoice: (invoiceId) => api.post(`/member-portal/payments/invoices/${invoiceId}/order`),
  membershipCheckout: (planId) => api.post('/member-portal/payments/membership/checkout', { planId }),
  ptCheckout: (ptPlanId) => api.post('/member-portal/payments/pt/checkout', { ptPlanId }),
  verify: (data) => api.post('/member-portal/payments/verify', data),
}

/* ── Complaints & requests ─────────────────────────────────────────────────── */
export const complaintApi = {
  list: () => api.get('/member-portal/complaints'),
  create: (data) => api.post('/member-portal/complaints', data),
}

/* ── Staff / trainer ratings ──────────────────────────────────────────────── */
export const staffRatingApi = {
  staff: () => api.get('/member-portal/staff-ratings/staff'),
  rate: (data) => api.post('/member-portal/staff-ratings', data),
}