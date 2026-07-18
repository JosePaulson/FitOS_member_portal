import { NavLink, Outlet } from 'react-router-dom'
import { useMemberAuth } from '../../context/MemberAuthContext'
import { useInstallPrompt } from '../../context/InstallPromptContext'
import InstallPrompt from '../InstallPrompt'
import GeofenceAttendancePrompt from '../GeofenceAttendancePrompt'
import RateLimitWarning from '../RateLimitWarning'

const TABS = [
  { to: '/',         icon: '🏠', label: 'Home'     },
  { to: '/workouts', icon: '🏋️', label: 'Workouts' },
  { to: '/chat',     icon: '💬', label: 'AI Coach'  },
  { to: '/bmi',      icon: '⚖️', label: 'BMI'       },
  { to: '/profile',  icon: '👤', label: 'Profile'   },
]

export default function Layout() {
  const { gym } = useMemberAuth()
  const { showBanner, showIOSBanner } = useInstallPrompt()
  const installBannerVisible = showBanner || showIOSBanner

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative"
         style={{ background: 'var(--color-surface)', color: 'var(--color-primary)' }}>

      {/* Top bar */}
      <header className="sticky top-0 z-40 px-5 h-14 flex items-center justify-between"
        style={{
          background: 'rgba(var(--color-surface-rgb, 13,13,13), 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          opacity: 1,
        }}>
        <span className="font-black text-lg tracking-tight" style={{ color: 'var(--color-primary)' }}>
          Fit<span style={{ color: 'var(--color-accent)' }}>OS</span>
        </span>
        {gym && (
          <span className="text-xs truncate max-w-[160px]" style={{ color: 'var(--color-secondary)' }}>
            {gym.name}
          </span>
        )}
      </header>

      {/* Page content — extra bottom padding when the taller install banner
          is showing, so content at the very bottom of a page (e.g. the
          Sign out button on Profile) never sits behind it. */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: installBannerVisible ? 220 : 80 }}>
        <Outlet />
      </main>

      {/* Install prompt — floats above the tab bar */}
      <InstallPrompt />

      {/* Global "mark your attendance" geofence prompt — checks once per app open */}
      <GeofenceAttendancePrompt />

      {/* Global rate-limit warning — fires on any 429 anywhere in the app */}
      <RateLimitWarning />

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md grid grid-cols-5 z-40"
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
