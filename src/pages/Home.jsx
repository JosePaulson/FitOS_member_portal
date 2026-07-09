import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import { portalApi } from '../api/index'
import Spinner, { Badge, membershipBadge } from '../components/ui/Spinner'

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function daysUntil(d) { return d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null }
function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
}

export default function Home() {
  const { member, gym } = useMemberAuth()
  const [summary,  setSummary]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([portalApi.attendanceSummary(), portalApi.ptSessions()])
      .then(([a, p]) => setSummary({ attendance: a.data, pt: p.data }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!member) return <div className="flex justify-center py-20"><Spinner /></div>

  const days = daysUntil(member.membershipExpiryDate)
  const [badgeColor, badgeLabel] = membershipBadge(member.membershipStatus)
  const expiryWarning = member.membershipStatus === 'active' && days !== null && days <= 10
  const totalCheckins = summary?.attendance?.reduce((s, m) => s + m.count, 0) ?? 0
  const ptTotal       = summary?.pt?.totalSessions ?? 0
  const ptRemaining   = summary?.pt?.sessionsRemaining

  return (
    <div className="px-5 py-6 flex flex-col gap-6 animate-fade-up">
      {/* Greeting */}
      <div>
        <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>{greeting()}</p>
        <h1 className="text-2xl font-black tracking-tight mt-0.5" style={{ color: 'var(--color-primary)' }}>
          {member.name?.split(' ')[0]} 👋
        </h1>
      </div>

      {/* Membership card */}
      <div className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--glow-lime) 0%, transparent 70%)' }} />
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--color-secondary)' }}>{gym?.name}</p>
            <p className="font-bold text-lg mt-0.5" style={{ color: 'var(--color-primary)' }}>{member.currentPlanId?.name || 'No active plan'}</p>
          </div>
          <Badge color={badgeColor}>{badgeLabel}</Badge>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--color-secondary)' }}>Member since</p>
            <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>{fmt(member.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--color-secondary)' }}>
              {member.membershipStatus === 'expired' ? 'Expired on' : 'Valid until'}
            </p>
            <p className="font-semibold" style={{ color: expiryWarning ? '#fbbf24' : 'var(--color-primary)' }}>
              {fmt(member.membershipExpiryDate)}
            </p>
          </div>
        </div>
        {expiryWarning && (
          <div className="mt-4 rounded-lg px-3 py-2 text-xs font-medium"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
            ⏰ Expires in {days} day{days === 1 ? '' : 's'} — contact your gym to renew
          </div>
        )}
        {member.membershipStatus === 'expired' && (
          <div className="mt-4 rounded-lg px-3 py-2 text-xs font-medium"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
            ❌ Membership expired — contact your gym to renew
          </div>
        )}
      </div>

      {/* Quick stats */}
      {loading
        ? <div className="flex justify-center py-4"><Spinner size="sm" /></div>
        : (
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon="📅" label="Check-ins"   value={totalCheckins} sub="all time" />
            <StatCard icon="💪" label="PT sessions" value={ptTotal}        sub="completed" />
            {ptRemaining !== null
              ? <StatCard icon="🎯" label="PT left"  value={ptRemaining}   sub="remaining" accent />
              : <StatCard icon="🏅" label="Sessions" value={ptTotal}        sub="total" />
            }
          </div>
        )
      }

      {/* Monthly bar chart */}
      {summary?.attendance?.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Monthly check-ins</h2>
          <div className="flex items-end gap-2 h-20">
            {[...summary.attendance].reverse().map((m) => {
              const max = Math.max(...summary.attendance.map((x) => x.count))
              const pct = Math.round((m.count / max) * 100)
              return (
                <div key={`${m._id.year}-${m._id.month}`} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--color-accent)' }}>{m.count}</span>
                  <div className="w-full rounded-t transition-all" style={{ height: `${pct}%`, minHeight: 4, background: 'rgba(200,241,53,0.3)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--color-secondary)' }}>{MONTH_NAMES[m._id.month]}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: '/billing',   icon: '🧾', label: 'Invoices' },
          { to: '/workouts',  icon: '🏋️', label: 'Workouts' },
          { to: '/equipment', icon: '⚙️', label: 'Equipment' },
          { to: '/chat',      icon: '💬', label: 'AI Coach' },
          { to: '/bmi',       icon: '⚖️', label: 'BMI' },
          { to: '/plans',     icon: '📋', label: 'Plans' },
          { to: '/profile',   icon: '👤', label: 'Profile' },
        ].map((l) => (
          <Link key={l.to} to={l.to}
            className="card p-3 flex flex-col items-center gap-1.5 text-center transition-all"
            style={{ '--hover-border': 'rgba(200,241,53,0.3)' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(200,241,53,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            <span className="text-2xl">{l.icon}</span>
            <span className="text-[11px] font-medium" style={{ color: 'var(--color-secondary)' }}>{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="card p-4 flex flex-col gap-1"
      style={{ ...(accent ? { borderColor: 'rgba(200,241,53,0.2)', background: 'rgba(200,241,53,0.05)' } : {}) }}>
      <span className="text-xl">{icon}</span>
      <span className="text-2xl font-black tracking-tight"
        style={{ color: accent ? 'var(--color-accent)' : 'var(--color-primary)' }}>{value}</span>
      <span className="text-[10px] leading-tight" style={{ color: 'var(--color-secondary)' }}>{label}<br />{sub}</span>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,'
}
