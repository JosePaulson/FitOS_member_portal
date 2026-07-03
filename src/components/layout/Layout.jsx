import { NavLink, Outlet } from 'react-router-dom'
import { useMemberAuth } from '../../context/MemberAuthContext'

const TABS = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/workouts', icon: '🏋️', label: 'Workouts' },
  { to: '/chat', icon: '💬', label: 'AI Coach' },
  { to: '/bmi', icon: '⚖️', label: 'BMI' },
  { to: '/profile', icon: '👤', label: 'Profile' },
]

export default function Layout() {
  const { gym } = useMemberAuth()

  return (
    <div className="relative flex flex-col max-w-md min-h-screen mx-auto"
      style={{ background: 'var(--color-surface)', color: 'var(--color-primary)' }}>

      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 h-14"
        style={{
          background: 'rgba(var(--color-surface-rgb, 13,13,13), 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          opacity: 1,
        }}>
        <span className="text-lg font-black tracking-tight" style={{ color: 'var(--color-primary)' }}>
          Fit<span style={{ color: 'var(--color-accent)' }}>OS</span>
        </span>
        {gym && (
          <span className="text-xs truncate max-w-[160px]" style={{ color: 'var(--color-secondary)' }}>
            {gym.name}
          </span>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 z-40 grid w-full max-w-md grid-cols-5 -translate-x-1/2 left-1/2"
        style={{
          background: 'var(--color-surface-2)',
          borderTop: '1px solid var(--color-border)',
        }}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className="flex flex-col items-center justify-center py-3 gap-0.5 transition-all"
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-accent)' : 'var(--color-secondary)',
            })}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
