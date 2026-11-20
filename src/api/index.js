import api from './axios'

export const authApi = {
  login: (data) => api.post('/member-portal/auth/login', data),
  refresh: (rt) => api.post('/member-portal/auth/refresh', { refreshToken: rt }),
  logout: () => api.post('/member-portal/auth/logout'),
  me: () => api.get('/member-portal/auth/me'),
  changePin: (data) => api.post('/member-portal/auth/change-pin', data),

  // Fingerprint / biometric login (WebAuthn)
  webauthnLoginOptions: (data) => api.post('/member-portal/auth/webauthn/login-options', data),
  webauthnLoginVerify: (data) => api.post('/member-portal/auth/webauthn/login-verify', data),
  webauthnList: () => api.get('/member-portal/auth/webauthn'),
  webauthnRegisterOptions: () => api.post('/member-portal/auth/webauthn/register-options'),
  webauthnRegisterVerify: (response, deviceName) => api.post('/member-portal/auth/webauthn/register-verify', { response, deviceName }),
  webauthnRemove: (credentialId) => api.delete(`/member-portal/auth/webauthn/${credentialId}`),
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
  invoicePdf: (id) => api.get(`/member-portal/invoices/${id}/pdf`, { responseType: 'blob' }),
  referral: () => api.get('/member-portal/referral'),
  // Waiver + PAR-Q: waiver() -> { enabled, text, questions, signed, current, needsGuardian, ... }
  waiver: () => api.get('/member-portal/waiver'),
  signWaiver: (data) => api.post('/member-portal/waiver/sign', data),

  // Progress: body measurements + personal records
  progress: () => api.get('/member-portal/progress/summary'),
  addMeasurement: (data) => api.post('/member-portal/progress/measurements', data),
  deleteMeasurement: (id) => api.delete(`/member-portal/progress/measurements/${id}`),

  // Streaks, badges, challenges, leaderboard
  engagement: () => api.get('/member-portal/engagement/overview'),
  setEngagementSettings: (data) => api.patch('/member-portal/engagement/settings', data), // { weeklyGoal?, hideFromLeaderboard? }
  challenges: () => api.get('/member-portal/engagement/challenges'),
  leaderboard: (challengeId) => api.get('/member-portal/engagement/leaderboard', { params: challengeId ? { challengeId } : {} }),

  // Notification inbox
  notifications: (params = {}) => api.get('/member-portal/notifications', { params }),
  unreadCount: () => api.get('/member-portal/notifications/unread-count'),
  markNotificationsRead: (data) => api.post('/member-portal/notifications/read', data),     // { ids } | { all: true }
  clearNotifications: () => api.delete('/member-portal/notifications'),

  // Auto-renew (prepares the renewal + reminds; the member still confirms payment)
  autoRenew: () => api.get('/member-portal/auto-renew'),
  setAutoRenew: (enabled) => api.put('/member-portal/auto-renew', { enabled }),
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
  exerciseCatalog: () => api.get('/member-portal/exercise-catalog'),
  workoutLibrary: (params = {}) => api.get('/member-portal/workout-library', { params }),

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

/* ── Weekly PT timetable (member — view + request/cancel own slots) ───────── */
export const timetableApi = {
  list: () => api.get('/member-portal/timetable'),
  request: (id, memberPTPlanId) => api.post(`/member-portal/timetable/${id}/request`, { memberPTPlanId }),
  cancelRequest: (id) => api.post(`/member-portal/timetable/${id}/cancel-request`),
  empty: (id) => api.post(`/member-portal/timetable/${id}/empty`),
}

/* ── My Transformation (member — progress photo gallery) ───────────────────── */
export const transformationApi = {
  list: () => api.get('/member-portal/transformation'),
  add: ({ file, date, weight, note }) => {
    const form = new FormData()
    form.append('image', file)
    form.append('date', date)
    if (weight !== undefined && weight !== null && weight !== '') form.append('weight', weight)
    if (note) form.append('note', note)
    return api.post('/member-portal/transformation', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  update: (id, data) => api.patch(`/member-portal/transformation/${id}`, data),
  remove: (id) => api.delete(`/member-portal/transformation/${id}`),
}

/* ── Meal Log (member — daily meal photo diary) ─────────────────────────── */
export const mealLogApi = {
  list: (params = {}) => api.get('/member-portal/meal-log', { params }),
  add: ({ file, mealType, eatenAt, note }) => {
    const form = new FormData()
    form.append('image', file)
    form.append('mealType', mealType)
    form.append('eatenAt', eatenAt)
    if (note) form.append('note', note)
    return api.post('/member-portal/meal-log', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  update: (id, data) => api.patch(`/member-portal/meal-log/${id}`, data),
  remove: (id) => api.delete(`/member-portal/meal-log/${id}`),
}

export const hydrationApi = {
  get: () => api.get('/member-portal/hydration'),
  update: (data) => api.put('/member-portal/hydration', data),
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
  // couponCode is optional — the server re-validates it at checkout.
  membershipCheckout: (planId, couponCode) => api.post('/member-portal/payments/membership/checkout', { planId, ...(couponCode ? { couponCode } : {}) }),
  ptCheckout: (ptPlanId, couponCode) => api.post('/member-portal/payments/pt/checkout', { ptPlanId, ...(couponCode ? { couponCode } : {}) }),
  // Preview only: { code, planId, type?: 'membership'|'pt' } -> { discount, finalAmount }
  validateCoupon: (data) => api.post('/member-portal/payments/coupons/validate', data),
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