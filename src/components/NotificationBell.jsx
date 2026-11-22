import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { portalApi } from '../api/index'

const POLL_MS = 150_000        // while the app is open and visible: every 2.5 minutes
const NAV_MIN_GAP_MS = 30_000  // route changes refresh at most this often
const FOCUS_MIN_GAP_MS = 10_000 // coming back to the app refreshes right away (unless just refreshed)

/**
 * Bell in the app header with an unread badge. Refreshes when the app opens,
 * when it's brought back to the foreground, after leaving the Notifications
 * page (so the badge clears right after reading), on route changes (at most
 * every 30 s) and every 2.5 minutes while visible. Never while hidden.
 */
export default function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const { pathname } = useLocation()
  const loadRef = useRef(null)
  const lastLoadRef = useRef(0)
  const prevPathRef = useRef(pathname)

  // One timer + visibility listener for the life of the header — not recreated on every navigation.
  useEffect(() => {
    let cancelled = false
    const load = (minGapMs = 0) => {
      if (document.hidden) return
      if (Date.now() - lastLoadRef.current < minGapMs) return
      lastLoadRef.current = Date.now()
      portalApi.unreadCount().then(({ data }) => { if (!cancelled) setUnread(data.unread || 0) }).catch(() => {})
    }
    loadRef.current = load
    load()
    const t = setInterval(() => load(POLL_MS - 5_000), POLL_MS)
    const onVisible = () => load(FOCUS_MIN_GAP_MS)
    document.addEventListener('visibilitychange', onVisible)
    return () => { cancelled = true; clearInterval(t); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  // Navigation: throttled — except right after leaving the Notifications page,
  // when the count has likely just changed and the badge should update now.
  useEffect(() => {
    const leftNotifications = prevPathRef.current.startsWith('/notifications') && !pathname.startsWith('/notifications')
    prevPathRef.current = pathname
    loadRef.current?.(leftNotifications ? 0 : NAV_MIN_GAP_MS)
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
function BellIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}
