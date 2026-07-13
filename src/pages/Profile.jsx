// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useMemberAuth } from '../context/MemberAuthContext'
// import { useThemeContext } from '../context/ThemeContext'
// import { portalApi, authApi } from '../api/index'
// import Spinner, { Badge, membershipBadge, ThemeToggle } from '../components/ui/Spinner'
// import { useInstallPrompt } from '../context/InstallPromptContext'
// import IOSInstallSheet from '../components/IOSInstallSheet'
// import { useNotifications } from '../context/NotificationContext'

// const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
// const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// export default function Profile() {
//   const { member, gym, logout } = useMemberAuth()
//   const { isDark, toggle } = useThemeContext()
//   const { canInstall, installed, isIOS, promptInstall } = useInstallPrompt()
//   const [showIOSSheet, setShowIOSSheet] = useState(false)
//   const notifications = useNotifications()
//   const [notifLoading, setNotifLoading] = useState(false)
//   const navigate = useNavigate()

//   const [attendance, setAttendance] = useState([])
//   const [streak, setStreak] = useState(0)
//   const [loading, setLoading] = useState(true)
//   const [viewMonth, setViewMonth] = useState(() => {
//     const n = new Date()
//     return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
//   })

//   const [showPin, setShowPin] = useState(false)
//   const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' })
//   const [pinError, setPinError] = useState('')
//   const [pinSuccess, setPinSuccess] = useState('')
//   const [pinLoading, setPinLoading] = useState(false)
//   const [logoutBusy, setLogoutBusy] = useState(false)

//   useEffect(() => {
//     setLoading(true)
//     portalApi.attendance({ month: viewMonth })
//       .then(({ data }) => { setAttendance(data.records); setStreak(data.streak) })
//       .catch(() => { })
//       .finally(() => setLoading(false))
//   }, [viewMonth])

//   async function handleChangePin(e) {
//     e.preventDefault()
//     setPinError(''); setPinSuccess('')
//     if (pinForm.newPin !== pinForm.confirmPin) { setPinError('New PINs do not match'); return }
//     if (pinForm.newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return }
//     setPinLoading(true)
//     try {
//       await authApi.changePin({ currentPin: pinForm.currentPin, newPin: pinForm.newPin })
//       setPinSuccess('PIN changed successfully!')
//       setPinForm({ currentPin: '', newPin: '', confirmPin: '' })
//       setTimeout(() => { setShowPin(false); setPinSuccess('') }, 1500)
//     } catch (err) {
//       setPinError(err.response?.data?.message || 'Failed to change PIN')
//     } finally { setPinLoading(false) }
//   }

//   async function handleLogout() {
//     setLogoutBusy(true)
//     await logout()
//     navigate('/login', { replace: true })
//   }

//   // Calendar helpers
//   const [calYear, calMonth] = viewMonth.split('-').map(Number)
//   const attendedDates = new Set(attendance.map((r) => new Date(r.date).toISOString().split('T')[0]))
//   const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
//   const daysInMonth = new Date(calYear, calMonth, 0).getDate()
//   const today = new Date().toISOString().split('T')[0]

//   function prevMonth() {
//     const d = new Date(calYear, calMonth - 2, 1)
//     setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
//   }
//   function nextMonth() {
//     const d = new Date(calYear, calMonth, 1)
//     if (d > new Date()) return
//     setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
//   }

//   const [badgeColor, badgeLabel] = membershipBadge(member?.membershipStatus)

//   const S = {
//     surface: 'var(--color-surface)',
//     surface2: 'var(--color-surface-2)',
//     surface3: 'var(--color-surface-3)',
//     border: 'var(--color-border)',
//     primary: 'var(--color-primary)',
//     secondary: 'var(--color-secondary)',
//     accent: 'var(--color-accent)',
//     hint: 'var(--color-hint)',
//   }

//   return (
//     <div className="flex flex-col gap-6 px-5 py-6">

//       {/* ── Member card ── */}
//       <div className="flex items-center gap-4 p-5 card">
//         <div className="flex items-center justify-center w-16 h-16 text-2xl font-black rounded-full shrink-0"
//           style={{ background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.25)', color: S.accent }}>
//           {member?.name?.[0]?.toUpperCase() || 'M'}
//         </div>
//         <div className="min-w-0">
//           <p className="text-lg font-bold truncate" style={{ color: S.primary }}>{member?.name}</p>
//           <p className="text-sm" style={{ color: S.secondary }}>{member?.phone}</p>
//           {member?.email && <p className="text-xs truncate" style={{ color: S.secondary }}>{member.email}</p>}
//           <div className="mt-1.5"><Badge color={badgeColor}>{badgeLabel}</Badge></div>
//         </div>
//       </div>

//       {/* ── Gym info ── */}
//       {gym && (
//         <div className="flex items-center gap-3 px-1">
//           <span className="text-2xl">🏢</span>
//           <div>
//             <p className="text-sm font-semibold" style={{ color: S.primary }}>{gym.name}</p>
//             <p className="text-xs" style={{ color: S.secondary }}>{gym.subdomain}.fitos.in</p>
//           </div>
//         </div>
//       )}

//       {/* ── Theme toggle ── */}
//       <div className="flex items-center justify-between p-5 card">
//         <div>
//           <p className="text-sm font-semibold" style={{ color: S.primary }}>
//             {isDark ? '🌙 Dark mode' : '☀️ Light mode'}
//           </p>
//           <p className="text-xs mt-0.5" style={{ color: S.secondary }}>
//             Your preference is saved automatically
//           </p>
//         </div>
//         <ThemeToggle isDark={isDark} onToggle={toggle} />
//       </div>

//       {/* ── Install app ── */}
//       {!installed && (canInstall || isIOS) && (
//         <button
//           onClick={() => (canInstall ? promptInstall() : setShowIOSSheet(true))}
//           className="flex items-center justify-between p-5 text-left card"
//         >
//           <div>
//             <p className="text-sm font-semibold" style={{ color: S.primary }}>📲 Install app</p>
//             <p className="text-xs mt-0.5" style={{ color: S.secondary }}>
//               Add FitOS to your home screen
//             </p>
//           </div>
//           <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
//             style={{ background: S.accent, color: '#0D0D0D' }}>
//             Install
//           </span>
//         </button>
//       )}
//       {installed && (
//         <div className="flex items-center gap-2 p-5 card">
//           <span style={{ color: S.accent }}>✓</span>
//           <p className="text-xs" style={{ color: S.secondary }}>App installed</p>
//         </div>
//       )}

//       {/* ── Notifications ── */}
//       {notifications.supported && (
//         <div className="p-5 card">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-semibold" style={{ color: S.primary }}>
//                 🔔 Notifications
//               </p>
//               <p className="text-xs mt-0.5" style={{ color: S.secondary }}>
//                 {notifications.subscribed
//                   ? 'Alerts for plan updates, invoices and renewals'
//                   : notifications.permission === 'denied'
//                     ? 'Blocked — enable in browser settings'
//                     : 'Get alerted when your gym updates your plans'}
//               </p>
//             </div>
//             <button
//               onClick={async () => {
//                 setNotifLoading(true)
//                 if (notifications.subscribed) await notifications.unsubscribe()
//                 else await notifications.subscribe()
//                 setNotifLoading(false)
//               }}
//               disabled={notifLoading || notifications.permission === 'denied'}
//               className="text-xs font-bold px-3.5 py-2 rounded-lg transition-all disabled:opacity-50"
//               style={
//                 notifications.subscribed
//                   ? { border: `1px solid ${S.border}`, color: S.secondary }
//                   : { background: S.accent, color: '#0D0D0D' }
//               }
//             >
//               {notifLoading ? '…' : notifications.subscribed ? 'Turn off' : 'Enable'}
//             </button>
//           </div>
//           {notifications.error && (
//             <p className="mt-3 text-xs" style={{ color: '#f87171' }}>{notifications.error}</p>
//           )}
//         </div>
//       )}

//       {/* ── Attendance calendar ── */}
//       <div className="p-5 card">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-sm font-bold" style={{ color: S.primary }}>Attendance</h2>
//           {streak > 0 && (
//             <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
//               style={{ background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.2)', color: S.accent }}>
//               🔥 {streak} day streak
//             </span>
//           )}
//         </div>

//         {/* Month nav */}
//         <div className="flex items-center justify-between mb-3">
//           <button onClick={prevMonth} className="px-1 text-lg transition-colors"
//             style={{ color: S.secondary }}
//             onMouseEnter={(e) => e.currentTarget.style.color = S.primary}
//             onMouseLeave={(e) => e.currentTarget.style.color = S.secondary}>‹</button>
//           <span className="text-sm font-semibold" style={{ color: S.primary }}>
//             {MONTHS[calMonth - 1]} {calYear}
//           </span>
//           <button onClick={nextMonth}
//             className="px-1 text-lg transition-colors"
//             style={{ color: new Date(calYear, calMonth, 1) > new Date() ? S.hint : S.secondary }}
//             onMouseEnter={(e) => { if (new Date(calYear, calMonth, 1) <= new Date()) e.currentTarget.style.color = S.primary }}
//             onMouseLeave={(e) => { if (new Date(calYear, calMonth, 1) <= new Date()) e.currentTarget.style.color = S.secondary }}>
//             ›
//           </button>
//         </div>

//         {/* Day headers */}
//         <div className="grid grid-cols-7 mb-1">
//           {DAYS.map((d, i) => (
//             <div key={i} className="text-center text-[10px] py-1" style={{ color: S.secondary }}>{d}</div>
//           ))}
//         </div>

//         {/* Grid */}
//         {loading ? (
//           <div className="flex justify-center py-6"><Spinner size="sm" /></div>
//         ) : (
//           <div className="grid grid-cols-7 gap-0.5">
//             {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
//             {Array.from({ length: daysInMonth }).map((_, i) => {
//               const day = i + 1
//               const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
//               const attended = attendedDates.has(dateStr)
//               const isToday = dateStr === today
//               return (
//                 <div key={day}
//                   className="flex items-center justify-center text-xs font-medium transition-all rounded-lg aspect-square"
//                   style={{
//                     background: attended ? S.accent : 'transparent',
//                     color: attended ? '#0D0D0D'
//                       : isToday ? S.accent
//                         : S.hint,
//                     border: isToday && !attended ? `1px solid ${S.accent}` : '1px solid transparent',
//                     fontWeight: attended ? 700 : 400,
//                   }}>
//                   {day}
//                 </div>
//               )
//             })}
//           </div>
//         )}

//         <p className="text-[11px] text-center mt-3" style={{ color: S.secondary }}>
//           {attendance.length} check-in{attendance.length !== 1 ? 's' : ''} this month
//         </p>
//       </div>

//       {/* ── Change PIN ── */}
//       <div className="p-5 card">
//         <button onClick={() => { setShowPin((v) => !v); setPinError(''); setPinSuccess('') }}
//           className="flex items-center justify-between w-full text-sm font-semibold"
//           style={{ color: S.primary }}>
//           <span>🔑 Change PIN</span>
//           <span className="text-lg" style={{ color: S.secondary }}>{showPin ? '−' : '+'}</span>
//         </button>

//         {showPin && (
//           <form onSubmit={handleChangePin} className="flex flex-col gap-3 pt-4 mt-4"
//             style={{ borderTop: `1px solid ${S.border}` }}>
//             {pinError && (
//               <p className="px-3 py-2 text-xs rounded-lg"
//                 style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
//                 {pinError}
//               </p>
//             )}
//             {pinSuccess && (
//               <p className="px-3 py-2 text-xs rounded-lg"
//                 style={{ background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.2)', color: S.accent }}>
//                 {pinSuccess}
//               </p>
//             )}
//             {[
//               { f: 'currentPin', label: 'Current PIN' },
//               { f: 'newPin', label: 'New PIN (4–6 digits)' },
//               { f: 'confirmPin', label: 'Confirm new PIN' },
//             ].map(({ f, label }) => (
//               <div key={f} className="flex flex-col gap-1.5">
//                 <label className="text-xs font-medium" style={{ color: S.secondary }}>{label}</label>
//                 <input type="password" inputMode="numeric" maxLength={6}
//                   value={pinForm[f]}
//                   onChange={(e) => setPinForm((v) => ({ ...v, [f]: e.target.value }))}
//                   className="field-input" placeholder="••••••" />
//               </div>
//             ))}
//             <button type="submit" disabled={pinLoading}
//               className="w-full font-bold py-2.5 rounded-lg text-sm transition-all disabled:opacity-60 mt-1"
//               style={{ background: S.accent, color: '#0D0D0D' }}>
//               {pinLoading ? 'Saving…' : 'Update PIN'}
//             </button>
//           </form>
//         )}
//       </div>

//       {/* ── App info ── */}
//       <div className="flex flex-col gap-2 p-5 card">
//         <h2 className="mb-1 text-sm font-bold" style={{ color: S.primary }}>About</h2>
//         {[
//           { label: 'App', value: 'FitOS Member Portal' },
//           { label: 'Version', value: '1.0.6' },
//           { label: 'Gym ID', value: gym?.subdomain || '—' },
//         ].map(({ label, value }) => (
//           <div key={label} className="flex justify-between text-sm">
//             <span style={{ color: S.secondary }}>{label}</span>
//             <span style={{ color: S.primary }}>{value}</span>
//           </div>
//         ))}
//       </div>

//       {/* ── Logout ── */}
//       <button onClick={handleLogout} disabled={logoutBusy}
//         className="w-full py-3 text-sm font-semibold transition-all rounded-xl disabled:opacity-50"
//         style={{ border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', background: 'rgba(248,113,113,0.05)' }}
//         onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
//         onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.05)'}>
//         {logoutBusy ? 'Signing out…' : 'Sign out'}
//       </button>

//       <div className="h-2" />

//       {showIOSSheet && <IOSInstallSheet onClose={() => setShowIOSSheet(false)} />}
//     </div>
//   )
// }


import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useThemeContext } from '../context/ThemeContext'
import { portalApi, authApi } from '../api/index'
import Spinner, { Badge, membershipBadge, ThemeToggle } from '../components/ui/Spinner'
import { useInstallPrompt } from '../context/InstallPromptContext'
import IOSInstallSheet from '../components/IOSInstallSheet'
import { useNotifications } from '../context/NotificationContext'
import { useAnchorScroll } from '../hooks/useAnchorScroll'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Profile() {
  const { member, gym, logout, refreshMember } = useMemberAuth()
  const { isDark, toggle } = useThemeContext()
  const { canInstall, installed, isIOS, promptInstall } = useInstallPrompt()
  const [showIOSSheet, setShowIOSSheet] = useState(false)
  const notifications = useNotifications()
  const [notifLoading, setNotifLoading] = useState(false)
  const navigate = useNavigate()

  const [attendance, setAttendance] = useState([])
  const [streak, setStreak] = useState(0)
  const [ptDates, setPtDates] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })

  const [showPin, setShowPin] = useState(false)
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' })
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)

  // Photo upload
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')

  // Editable profile details (age / height / medical conditions)
  const [showDetails, setShowDetails] = useState(false)
  const [detailsForm, setDetailsForm] = useState({ age: '', height: '', healthNotes: '' })
  const [detailsError, setDetailsError] = useState('')
  const [detailsSaved, setDetailsSaved] = useState(false)
  const [detailsSaving, setDetailsSaving] = useState(false)

  useEffect(() => {
    if (!member) return
    setDetailsForm({
      age: member.age ?? '',
      height: member.height ?? '',
      healthNotes: member.healthNotes ?? '',
    })
  }, [member])

  useAnchorScroll()

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    setPhotoError('')
    setPhotoUploading(true)
    try {
      await portalApi.uploadPhoto(file)
      await refreshMember()
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Failed to upload photo')
    } finally { setPhotoUploading(false) }
  }

  async function handleSaveDetails(e) {
    e.preventDefault()
    setDetailsError(''); setDetailsSaved(false); setDetailsSaving(true)
    try {
      await portalApi.updateProfile({
        age: detailsForm.age === '' ? null : Number(detailsForm.age),
        height: detailsForm.height === '' ? null : Number(detailsForm.height),
        healthNotes: detailsForm.healthNotes,
      })
      await refreshMember()
      setDetailsSaved(true)
      setTimeout(() => setDetailsSaved(false), 2000)
    } catch (err) {
      setDetailsError(err.response?.data?.message || 'Failed to save changes')
    } finally { setDetailsSaving(false) }
  }

  useEffect(() => {
    setLoading(true)
    const [y, m] = viewMonth.split('-').map(Number)
    const from = `${y}-${String(m).padStart(2, '0')}-01`
    const to = `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`

    Promise.all([
      portalApi.attendance({ month: viewMonth }),
      // "Confirmed" PTs — scheduled (trainer-confirmed) or completed;
      // pending requests and declined/cancelled ones don't count.
      portalApi.ptSessions({ from, to, limit: 100 }),
    ])
      .then(([attRes, ptRes]) => {
        setAttendance(attRes.data.records)
        setStreak(attRes.data.streak)
        const confirmed = (ptRes.data.sessions || []).filter((s) => ['scheduled', 'completed'].includes(s.status))
        setPtDates(new Set(confirmed.map((s) => new Date(s.date).toISOString().split('T')[0])))
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [viewMonth])

  async function handleChangePin(e) {
    e.preventDefault()
    setPinError(''); setPinSuccess('')
    if (pinForm.newPin !== pinForm.confirmPin) { setPinError('New PINs do not match'); return }
    if (pinForm.newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return }
    setPinLoading(true)
    try {
      await authApi.changePin({ currentPin: pinForm.currentPin, newPin: pinForm.newPin })
      setPinSuccess('PIN changed successfully!')
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' })
      setTimeout(() => { setShowPin(false); setPinSuccess('') }, 1500)
    } catch (err) {
      setPinError(err.response?.data?.message || 'Failed to change PIN')
    } finally { setPinLoading(false) }
  }

  async function handleLogout() {
    setLogoutBusy(true)
    await logout()
    navigate('/login', { replace: true })
  }

  // Calendar helpers
  const [calYear, calMonth] = viewMonth.split('-').map(Number)
  const attendedDates = new Set(attendance.map((r) => new Date(r.date).toISOString().split('T')[0]))
  const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  function prevMonth() {
    const d = new Date(calYear, calMonth - 2, 1)
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  function nextMonth() {
    const d = new Date(calYear, calMonth, 1)
    if (d > new Date()) return
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const [badgeColor, badgeLabel] = membershipBadge(member?.membershipStatus)

  const S = {
    surface: 'var(--color-surface)',
    surface2: 'var(--color-surface-2)',
    surface3: 'var(--color-surface-3)',
    border: 'var(--color-border)',
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    accent: 'var(--color-accent)',
    hint: 'var(--color-hint)',
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-6">

      {/* ── Member card ── */}
      <div className="flex items-center gap-4 p-5 card">
        <label className="relative w-16 h-16 rounded-full cursor-pointer shrink-0 group">
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
          {member?.photo ? (
            <img src={member.photo} alt={member.name} className="object-cover w-16 h-16 rounded-full" />
          ) : (
            <div className="flex items-center justify-center w-16 h-16 text-2xl font-black rounded-full"
              style={{ background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.25)', color: S.accent }}>
              {member?.name?.[0]?.toUpperCase() || 'M'}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold transition-opacity rounded-full opacity-0 group-hover:opacity-100"
            style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
            {photoUploading ? '…' : '📷'}
          </div>
        </label>
        <div className="min-w-0">
          <p className="text-lg font-bold truncate" style={{ color: S.primary }}>{member?.name}</p>
          <p className="text-sm" style={{ color: S.secondary }}>{member?.phone}</p>
          {member?.email && <p className="text-xs truncate" style={{ color: S.secondary }}>{member.email}</p>}
          <div className="mt-1.5"><Badge color={badgeColor}>{badgeLabel}</Badge></div>
        </div>
      </div>
      {photoError && (
        <p className="-mt-4 text-xs" style={{ color: '#f87171' }}>{photoError}</p>
      )}

      {/* ── Gym info ── */}
      {gym && (
        <div className="flex items-center gap-3 px-1">
          <span className="text-2xl">🏢</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: S.primary }}>{gym.name}</p>
            <p className="text-xs" style={{ color: S.secondary }}>{gym.subdomain}.fitos.in</p>
          </div>
        </div>
      )}

      {/* ── Theme toggle ── */}
      <div className="flex items-center justify-between p-5 card">
        <div>
          <p className="text-sm font-semibold" style={{ color: S.primary }}>
            {isDark ? '🌙 Dark mode' : '☀️ Light mode'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: S.secondary }}>
            Your preference is saved automatically
          </p>
        </div>
        <ThemeToggle isDark={isDark} onToggle={toggle} />
      </div>

      {/* ── Install app ── */}
      {!installed && (canInstall || isIOS) && (
        <button
          onClick={() => (canInstall ? promptInstall() : setShowIOSSheet(true))}
          className="flex items-center justify-between p-5 text-left card"
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: S.primary }}>📲 Install app</p>
            <p className="text-xs mt-0.5" style={{ color: S.secondary }}>
              Add FitOS to your home screen
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: S.accent, color: '#0D0D0D' }}>
            Install
          </span>
        </button>
      )}
      {installed && (
        <div className="flex items-center gap-2 p-5 card">
          <span style={{ color: S.accent }}>✓</span>
          <p className="text-xs" style={{ color: S.secondary }}>App installed</p>
        </div>
      )}

      {/* ── Notifications ── */}
      {notifications.supported && (
        <div className="p-5 card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: S.primary }}>
                🔔 Notifications
              </p>
              <p className="text-xs mt-0.5" style={{ color: S.secondary }}>
                {notifications.subscribed
                  ? 'Alerts for plan updates, invoices and renewals'
                  : notifications.permission === 'denied'
                    ? 'Blocked — enable in browser settings'
                    : 'Get alerted when your gym updates your plans'}
              </p>
            </div>
            <button
              onClick={async () => {
                setNotifLoading(true)
                if (notifications.subscribed) await notifications.unsubscribe()
                else await notifications.subscribe()
                setNotifLoading(false)
              }}
              disabled={notifLoading || notifications.permission === 'denied'}
              className="text-xs font-bold px-3.5 py-2 rounded-lg transition-all disabled:opacity-50"
              style={
                notifications.subscribed
                  ? { border: `1px solid ${S.border}`, color: S.secondary }
                  : { background: S.accent, color: '#0D0D0D' }
              }
            >
              {notifLoading ? '…' : notifications.subscribed ? 'Turn off' : 'Enable'}
            </button>
          </div>
          {notifications.error && (
            <p className="mt-3 text-xs" style={{ color: '#f87171' }}>{notifications.error}</p>
          )}
        </div>
      )}

      {/* ── Attendance calendar ── */}
      <div id="attendance" className="p-5 card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: S.primary }}>Attendance</h2>
          {streak > 0 && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(200,241,53,0.1)',
                border: '1px solid rgba(200,241,53,0.2)',
                color: S.accent,
              }}
            >
              🔥 {streak} day streak
            </span>
          )}
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="px-1 text-lg transition-colors"
            style={{ color: S.secondary }}
            onMouseEnter={(e) => e.currentTarget.style.color = S.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = S.secondary}>‹</button>
          <span className="text-sm font-semibold" style={{ color: S.primary }}>
            {MONTHS[calMonth - 1]} {calYear}
          </span>
          <button onClick={nextMonth}
            className="px-1 text-lg transition-colors"
            style={{ color: new Date(calYear, calMonth, 1) > new Date() ? S.hint : S.secondary }}
            onMouseEnter={(e) => { if (new Date(calYear, calMonth, 1) <= new Date()) e.currentTarget.style.color = S.primary }}
            onMouseLeave={(e) => { if (new Date(calYear, calMonth, 1) <= new Date()) e.currentTarget.style.color = S.secondary }}>
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-[10px] py-1" style={{ color: S.secondary }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-6"><Spinner size="sm" /></div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const attended = attendedDates.has(dateStr)
              const hasPT = ptDates.has(dateStr)
              const isToday = dateStr === today
              return (
                <div key={day}
                  className="aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: attended ? S.accent : hasPT ? '#9333ea88' : 'transparent',
                    color: attended ? '#0D0D0D'
                      : hasPT ? 'beige'
                        : isToday ? S.accent
                          : S.hint,
                    border: attended ? '1px solid transparent'
                      : hasPT ? '1px solid #9333eaaa'
                        : isToday ? `1px solid ${S.accent}`
                          : '1px solid transparent',
                    fontWeight: attended ? 700 : 400,
                  }}>
                  <span className="leading-none">{day}</span>
                  {hasPT && (
                    <span className="text-[6.5px] font-bold px-1 py-px rounded-full leading-none"
                      style={{ background: 'beige', color: '#000' }}>
                      PT
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-[11px] text-center mt-3" style={{ color: S.secondary }}>
          {attendance.length + ptDates.size} check-in{(attendance.length + ptDates.size) !== 1 ? 's' : ''} this month
        </p>
        <p className="text-[11px] text-center mt-1" style={{ color: '#9333ea' }}>
          {ptDates.size} PT session{ptDates.size !== 1 ? 's' : ''} this month
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[10px]" style={{ color: S.secondary }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: S.accent }} /> Attendance
          </span>
          <span className="flex items-center gap-1.5 text-[10px]" style={{ color: S.secondary }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#9333ea88', border: '1px solid #9333eaaa' }} /> PT session
          </span>
        </div>
      </div>

      {/* ── My details (age, height, medical conditions) ── */}
      <div className="p-5 card">
        <button onClick={() => { setShowDetails((v) => !v); setDetailsError(''); setDetailsSaved(false) }}
          className="flex items-center justify-between w-full text-sm font-semibold"
          style={{ color: S.primary }}>
          <span>🧍 My details</span>
          <span className="text-lg" style={{ color: S.secondary }}>{showDetails ? '−' : '+'}</span>
        </button>

        {showDetails && (
          <form onSubmit={handleSaveDetails} className="flex flex-col gap-3 pt-4 mt-4"
            style={{ borderTop: `1px solid ${S.border}` }}>
            {detailsError && (
              <p className="px-3 py-2 text-xs rounded-lg"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                {detailsError}
              </p>
            )}
            {detailsSaved && (
              <p className="px-3 py-2 text-xs rounded-lg"
                style={{ background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.2)', color: S.accent }}>
                Saved!
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: S.secondary }}>Age</label>
                <input type="number" min="0" max="120" inputMode="numeric"
                  value={detailsForm.age}
                  onChange={(e) => setDetailsForm((v) => ({ ...v, age: e.target.value }))}
                  className="field-input" placeholder="optional" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: S.secondary }}>Height (cm)</label>
                <input type="number" min="30" max="250" inputMode="numeric"
                  value={detailsForm.height}
                  onChange={(e) => setDetailsForm((v) => ({ ...v, height: e.target.value }))}
                  className="field-input" placeholder="optional" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: S.secondary }}>Medical conditions (if any)</label>
              <textarea rows={3}
                value={detailsForm.healthNotes}
                onChange={(e) => setDetailsForm((v) => ({ ...v, healthNotes: e.target.value }))}
                className="resize-none field-input"
                placeholder="e.g. asthma, knee injury, high blood pressure — visible to your trainers" />
            </div>

            <button type="submit" disabled={detailsSaving}
              className="w-full font-bold py-2.5 rounded-lg text-sm transition-all disabled:opacity-60 mt-1"
              style={{ background: S.accent, color: '#0D0D0D' }}>
              {detailsSaving ? 'Saving…' : 'Save details'}
            </button>
          </form>
        )}
      </div>

      {/* ── Change PIN ── */}
      <div className="p-5 card">
        <button onClick={() => { setShowPin((v) => !v); setPinError(''); setPinSuccess('') }}
          className="flex items-center justify-between w-full text-sm font-semibold"
          style={{ color: S.primary }}>
          <span>🔑 Change PIN</span>
          <span className="text-lg" style={{ color: S.secondary }}>{showPin ? '−' : '+'}</span>
        </button>

        {showPin && (
          <form onSubmit={handleChangePin} className="flex flex-col gap-3 pt-4 mt-4"
            style={{ borderTop: `1px solid ${S.border}` }}>
            {pinError && (
              <p className="px-3 py-2 text-xs rounded-lg"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                {pinError}
              </p>
            )}
            {pinSuccess && (
              <p className="px-3 py-2 text-xs rounded-lg"
                style={{ background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.2)', color: S.accent }}>
                {pinSuccess}
              </p>
            )}
            {[
              { f: 'currentPin', label: 'Current PIN' },
              { f: 'newPin', label: 'New PIN (4–6 digits)' },
              { f: 'confirmPin', label: 'Confirm new PIN' },
            ].map(({ f, label }) => (
              <div key={f} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: S.secondary }}>{label}</label>
                <input type="password" inputMode="numeric" maxLength={6}
                  value={pinForm[f]}
                  onChange={(e) => setPinForm((v) => ({ ...v, [f]: e.target.value }))}
                  className="field-input" placeholder="••••••" />
              </div>
            ))}
            <button type="submit" disabled={pinLoading}
              className="w-full font-bold py-2.5 rounded-lg text-sm transition-all disabled:opacity-60 mt-1"
              style={{ background: S.accent, color: '#0D0D0D' }}>
              {pinLoading ? 'Saving…' : 'Update PIN'}
            </button>
          </form>
        )}
      </div>

      {/* ── App info ── */}
      <div className="flex flex-col gap-2 p-5 card">
        <h2 className="mb-1 text-sm font-bold" style={{ color: S.primary }}>About</h2>
        {[
          { label: 'App', value: 'FitOS Member Portal' },
          { label: 'Version', value: '1.5.2' },
          { label: 'Gym ID', value: gym?.subdomain || '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span style={{ color: S.secondary }}>{label}</span>
            <span style={{ color: S.primary }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Logout ── */}
      <button onClick={handleLogout} disabled={logoutBusy}
        className="w-full py-3 text-sm font-semibold transition-all rounded-xl disabled:opacity-50"
        style={{ border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', background: 'rgba(248,113,113,0.05)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.05)'}>
        {logoutBusy ? 'Signing out…' : 'Sign out'}
      </button>

      <div className="h-2" />

      {showIOSSheet && <IOSInstallSheet onClose={() => setShowIOSSheet(false)} />}
    </div>
  )
}