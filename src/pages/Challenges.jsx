import { useCallback, useEffect, useState } from 'react'
import { portalApi } from '../api/index'
import Spinner from '../components/ui/Spinner'
import { dialog } from '../components/ui/Dialog'
import { fmtDate } from '../lib/dateIST'

const S = { primary: 'var(--color-primary)', secondary: 'var(--color-secondary)', accent: 'var(--color-accent)', border: 'var(--color-border)' }
const fmtDay = (d) => fmtDate(`${d}T00:00:00Z`)

export default function Challenges() {
  const [ov, setOv] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [board, setBoard] = useState(null)         // leaderboard payload
  const [boardFor, setBoardFor] = useState('month') // 'month' | challenge id
  const [error, setError] = useState('')

  const loadBoard = useCallback((which) => {
    setBoardFor(which)
    portalApi.leaderboard(which === 'month' ? undefined : which).then(({ data }) => setBoard(data)).catch(() => setBoard(null))
  }, [])
  const loadAll = useCallback(() => {
    Promise.all([portalApi.engagement(), portalApi.challenges()])
      .then(([o, c]) => { setOv(o.data); setChallenges(c.data) })
      .catch((e) => setError(e.response?.data?.message || 'Couldn\u2019t load this page. Please try again.'))
    loadBoard('month')
  }, [loadBoard])
  useEffect(() => { loadAll() }, [loadAll])

  async function setSettings(patch) {
    try { await portalApi.setEngagementSettings(patch); loadAll() }
    catch (e) { dialog.error(e.response?.data?.message || 'Please try again in a moment.', { title: 'Couldn’t save that' }) }
  }

  if (error) return <p className="px-5 py-6 text-sm" style={{ color: '#f87171' }}>{error}</p>
  if (!ov) return <div className="flex justify-center py-20"><Spinner /></div>

  const goal = ov.settings.weeklyGoal
  const pct = Math.min(1, ov.thisWeek / goal)
  const R = 34, C = 2 * Math.PI * R
  const live = challenges.filter((c) => c.status === 'live')

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <h1 className="text-xl font-bold tracking-tight" style={{ color: S.primary }}>Streaks &amp; challenges</h1>

      {/* Streak + weekly goal */}
      <div className="p-5 card">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0" style={{ width: 84, height: 84 }}>
            <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="42" cy="42" r={R} fill="none" stroke="var(--color-border)" strokeWidth="7" />
              <circle cx="42" cy="42" r={R} fill="none" stroke="var(--color-accent)" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black leading-none" style={{ color: S.primary }}>{ov.thisWeek}/{goal}</span>
              <span className="text-[9px] uppercase" style={{ color: S.secondary }}>this week</span>
            </div>
          </div>
          <div>
            <p className="text-3xl font-black" style={{ color: S.primary }}>🔥 {ov.currentStreak}<span className="ml-1 text-sm font-medium" style={{ color: S.secondary }}>week{ov.currentStreak === 1 ? '' : 's'}</span></p>
            <p className="mt-0.5 text-xs" style={{ color: S.secondary }}>
              {ov.weeklyMet ? 'Weekly goal done — nice work!' : `${goal - ov.thisWeek} more visit${goal - ov.thisWeek === 1 ? '' : 's'} to keep your streak going`}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: S.secondary }}>Best: {ov.bestStreak} wk · {ov.monthVisits} visits this month · {ov.totalVisits} total</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 mt-4" style={{ borderTop: `1px solid ${S.border}` }}>
          <span className="text-xs" style={{ color: S.secondary }}>Weekly goal (visits per week)</span>
          <div className="flex items-center gap-3">
            <button disabled={goal <= 1} onClick={() => setSettings({ weeklyGoal: goal - 1 })} className="flex items-center justify-center w-8 h-8 text-lg rounded-full disabled:opacity-30" style={{ border: `1px solid ${S.border}`, color: S.primary }}>−</button>
            <span className="w-4 text-sm font-bold text-center" style={{ color: S.primary }}>{goal}</span>
            <button disabled={goal >= 7} onClick={() => setSettings({ weeklyGoal: goal + 1 })} className="flex items-center justify-center w-8 h-8 text-lg rounded-full disabled:opacity-30" style={{ border: `1px solid ${S.border}`, color: S.primary }}>+</button>
          </div>
        </div>
      </div>

      {/* Challenges */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: S.secondary }}>Challenges</p>
        {challenges.length === 0 ? (
          <div className="p-5 text-sm card" style={{ color: S.secondary }}>No challenges running right now. Your gym will announce the next one!</div>
        ) : challenges.map((c) => (
          <div key={c._id} className="p-4 card" style={{ opacity: c.status === 'ended' && !c.completed ? 0.65 : 1 }}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold" style={{ color: S.primary }}>{c.completed ? '✅ ' : ''}{c.title}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: c.status === 'live' ? 'rgba(200,241,53,0.12)' : 'rgba(255,255,255,0.06)', color: c.status === 'live' ? S.accent : S.secondary }}>
                {c.status === 'live' ? (c.daysLeft === 0 ? 'Last day' : `${c.daysLeft}d left`) : c.status === 'upcoming' ? `Starts ${fmtDay(c.startDate)}` : 'Ended'}
              </span>
            </div>
            {c.description && <p className="mt-1 text-xs" style={{ color: S.secondary }}>{c.description}</p>}
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <div style={{ width: `${c.percent}%`, height: '100%', background: 'var(--color-accent)', transition: 'width .4s' }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px]" style={{ color: S.secondary }}>
              <span>{c.count} / {c.target} {c.metric === 'visits' ? 'visits' : 'workouts'}</span>
              <span>{fmtDay(c.startDate)} – {fmtDay(c.endDate)}</span>
            </div>
            {c.reward && <p className="mt-2 text-xs" style={{ color: S.accent }}>🎁 {c.completed ? `Show this to the front desk: ${c.reward}` : `Reward: ${c.reward}`}</p>}
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="flex flex-col gap-3 p-5 card">
        <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: S.secondary }}>Leaderboard</p>
        <div className="flex gap-2 pb-1 overflow-x-auto">
          {[['month', 'This month'], ...live.map((c) => [c._id, c.title])].map(([k, label]) => (
            <button key={k} onClick={() => loadBoard(k)} className="px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap"
              style={{ border: `1px solid ${boardFor === k ? S.accent : S.border}`, color: boardFor === k ? S.accent : S.secondary, background: boardFor === k ? 'rgba(200,241,53,0.1)' : 'transparent' }}>
              {label}
            </button>
          ))}
        </div>
        {!board ? <div className="flex justify-center py-4"><Spinner /></div> : board.entries.length === 0 ? (
          <p className="py-2 text-sm" style={{ color: S.secondary }}>No visits recorded yet — be the first on the board!</p>
        ) : (
          <div className="flex flex-col">
            {board.entries.map((e, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-2 text-sm rounded-lg"
                style={{ background: e.isMe ? 'rgba(200,241,53,0.1)' : 'transparent', borderTop: i === 0 ? 'none' : `1px solid ${S.border}` }}>
                <span style={{ color: e.isMe ? S.accent : S.primary }}>
                  <span className="inline-block w-8" style={{ color: S.secondary }}>{e.rank <= 3 ? ['🥇', '🥈', '🥉'][e.rank - 1] : `#${e.rank}`}</span>
                  {e.name}{e.isMe ? ' (you)' : ''}
                </span>
                <span className="font-semibold" style={{ color: S.primary }}>{e.count}</span>
              </div>
            ))}
          </div>
        )}
        {board?.me && (
          <p className="text-xs" style={{ color: S.secondary }}>
            {board.me.hidden ? `You've hidden yourself from the board — your count is ${board.me.count}.` : board.me.rank ? `You're #${board.me.rank} with ${board.me.count}.` : `You have ${board.me.count} so far.`}
          </p>
        )}
        <label className="flex items-center gap-2 pt-3 text-xs cursor-pointer" style={{ color: S.secondary, borderTop: `1px solid ${S.border}` }}>
          <input type="checkbox" checked={!ov.settings.hideFromLeaderboard} onChange={(e) => setSettings({ hideFromLeaderboard: !e.target.checked })} />
          Show me on leaderboards (other members see only your first name and last initial)
        </label>
      </div>

      {/* Badges */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: S.secondary }}>Badges · {ov.earnedCount} of {ov.badges.length}</p>
        <div className="grid grid-cols-3 gap-3">
          {[...ov.badges].sort((a, b) => Number(b.earned) - Number(a.earned)).map((b) => (
            <div key={b.key} className="flex flex-col items-center p-3 text-center card" style={{ opacity: b.earned ? 1 : 0.5 }} title={b.desc}>
              <span className="text-2xl" style={{ filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</span>
              <span className="mt-1 text-[11px] font-semibold leading-tight" style={{ color: S.primary }}>{b.label}</span>
              <span className="mt-0.5 text-[10px]" style={{ color: S.secondary }}>{b.earned ? 'Earned' : `${b.progress}/${b.target}`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
