import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useThemeContext } from '../context/ThemeContext'
import { portalApi, authApi } from '../api/index'
import Spinner, { Badge, membershipBadge, ThemeToggle } from '../components/ui/Spinner'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Profile() {
  const { member, gym, logout } = useMemberAuth()
  const { isDark, toggle } = useThemeContext()
  const navigate = useNavigate()

  const [attendance, setAttendance] = useState([])
  const [streak, setStreak] = useState(0)
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

  useEffect(() => {
    setLoading(true)
    portalApi.attendance({ month: viewMonth })
      .then(({ data }) => { setAttendance(data.records); setStreak(data.streak) })
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
        <div className="flex items-center justify-center w-16 h-16 text-2xl font-black rounded-full shrink-0"
          style={{ background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.25)', color: S.accent }}>
          {member?.name?.[0]?.toUpperCase() || 'M'}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold truncate" style={{ color: S.primary }}>{member?.name}</p>
          <p className="text-sm" style={{ color: S.secondary }}>{member?.phone}</p>
          {member?.email && <p className="text-xs truncate" style={{ color: S.secondary }}>{member.email}</p>}
          <div className="mt-1.5"><Badge color={badgeColor}>{badgeLabel}</Badge></div>
        </div>
      </div>

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

      {/* ── Attendance calendar ── */}
      <div className="p-5 card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: S.primary }}>Attendance</h2>
          {streak > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.2)', color: S.accent }}>
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
              const isToday = dateStr === today
              return (
                <div key={day}
                  className="flex items-center justify-center text-xs font-medium transition-all rounded-lg aspect-square"
                  style={{
                    background: attended ? S.accent : 'transparent',
                    color: attended ? '#0D0D0D'
                      : isToday ? S.accent
                        : S.hint,
                    border: isToday && !attended ? `1px solid ${S.accent}` : '1px solid transparent',
                    fontWeight: attended ? 700 : 400,
                  }}>
                  {day}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-[11px] text-center mt-3" style={{ color: S.secondary }}>
          {attendance.length} check-in{attendance.length !== 1 ? 's' : ''} this month
        </p>
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
          { label: 'Version', value: '1.0.0' },
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
    </div>
  )
}
