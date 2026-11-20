import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { portalApi } from '../api/index'

/** Bell in the app header with an unread badge; refreshes on navigation and every minute while the app is visible. */
export default function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const { pathname } = useLocation()

  useEffect(() => {
    let cancelled = false
    const load = () => {
      if (document.hidden) return
      portalApi.unreadCount().then(({ data }) => { if (!cancelled) setUnread(data.unread || 0) }).catch(() => { })
    }
    load()
    const t = setInterval(load, 60_000)
    document.addEventListener('visibilitychange', load)
    return () => { cancelled = true; clearInterval(t); document.removeEventListener('visibilitychange', load) }
  }, [pathname])

  return (
    <Link to="/notifications" aria-label={unread ? `${unread} unread notifications` : 'Notifications'} className="relative flex items-center leading-none">
      <BellIcon size={20} />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full flex items-center justify-center"
          style={{ background: '#f87171', color: '#fff' }}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}

/** Simple outlined bell in the FitOS accent colour. */
function BellIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}
