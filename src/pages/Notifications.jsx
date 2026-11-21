import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { portalApi } from '../api/index'
import Spinner from '../components/ui/Spinner'
import { dialog } from '../components/ui/Dialog'
import { fmtDate } from '../lib/dateIST'

const S = { primary: 'var(--color-primary)', secondary: 'var(--color-secondary)', accent: 'var(--color-accent)', border: 'var(--color-border)' }
const ICON = { announcement: '📣', badge: '🏅', challenge: '🎯', renewal: '🔁', pr: '🏆', general: '🔔' }

function ago(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`
  return fmtDate(d)
}

export default function Notifications() {
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [unread, setUnread] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    portalApi.notifications({ limit: 30 })
      .then(({ data }) => { setItems(data.items); setUnread(data.unread); setHasMore(data.hasMore) })
      .catch((e) => setError(e.response?.data?.message || 'Couldn\u2019t load your notifications. Please try again.'))
  }, [])
  useEffect(() => { load() }, [load])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const { data } = await portalApi.notifications({ limit: 30, before: items[items.length - 1].createdAt })
      setItems((x) => [...x, ...data.items]); setHasMore(data.hasMore)
    } catch { /* leave the button for another try */ } finally { setLoadingMore(false) }
  }

  async function open(n) {
    if (!n.readAt) {
      setItems((x) => x.map((i) => (i._id === n._id ? { ...i, readAt: new Date().toISOString() } : i)))
      setUnread((u) => Math.max(0, u - 1))
      portalApi.markNotificationsRead({ ids: [n._id] }).catch(() => {})
    }
    if (n.url && n.url.startsWith('/') && n.url !== '/notifications') navigate(n.url)
  }
  async function markAll() {
    setItems((x) => x.map((i) => ({ ...i, readAt: i.readAt || new Date().toISOString() }))); setUnread(0)
    portalApi.markNotificationsRead({ all: true }).catch(() => {})
  }
  async function clearAll() {
    if (!(await dialog.confirm({ title: 'Clear all notifications?', message: 'They’ll be removed from your inbox.', confirmLabel: 'Clear all', tone: 'danger' }))) return
    try { await portalApi.clearNotifications(); setItems([]); setUnread(0); setHasMore(false) } catch { dialog.error('Please try again in a moment.', { title: 'Couldn’t clear them' }) }
  }

  if (error) return <p className="px-5 py-6 text-sm" style={{ color: '#f87171' }}>{error}</p>
  if (!items) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="flex flex-col gap-4 px-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: S.primary }}>Inbox</h1>
        {items.length > 0 && (
          <div className="flex gap-4 text-xs">
            {unread > 0 && <button onClick={markAll} style={{ color: S.accent }}>Mark all read</button>}
            <button onClick={clearAll} style={{ color: S.secondary }}>Clear</button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center card">
          <p className="text-3xl">🔔</p>
          <p className="mt-2 text-sm font-semibold" style={{ color: S.primary }}>You're all caught up</p>
          <p className="mt-1 text-xs" style={{ color: S.secondary }}>Announcements from your gym, badges, records and renewal reminders show up here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => (
            <button key={n._id} onClick={() => open(n)} className="flex items-start w-full gap-3 p-4 text-left card"
              style={{ borderColor: n.readAt ? undefined : 'rgba(200,241,53,0.35)' }}>
              <span className="text-xl">{ICON[n.type] || ICON.general}</span>
              <span className="flex-1 min-w-0">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold" style={{ color: S.primary }}>{n.title}</span>
                  {!n.readAt && <span className="w-2 h-2 mt-1.5 rounded-full shrink-0" style={{ background: S.accent }} />}
                </span>
                {n.body && <span className="block mt-0.5 text-xs whitespace-pre-wrap" style={{ color: S.secondary }}>{n.body}</span>}
                <span className="block mt-1 text-[11px]" style={{ color: S.secondary }}>{ago(n.createdAt)}</span>
              </span>
            </button>
          ))}
          {hasMore && (
            <button onClick={loadMore} disabled={loadingMore} className="py-3 text-sm font-semibold rounded-xl disabled:opacity-60" style={{ border: `1px solid ${S.border}`, color: S.secondary }}>
              {loadingMore ? 'Loading…' : 'Load older'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
