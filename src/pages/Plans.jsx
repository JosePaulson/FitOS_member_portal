import { useEffect, useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { portalApi } from '../api/index'
import Spinner, { Badge, membershipBadge, Card, EmptyState } from '../components/ui/Spinner'

function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

export default function Plans() {
  const { member } = useMemberAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalApi.plans()
      .then(({ data }) => setPlans(data))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const [badgeColor, badgeLabel] = membershipBadge(member?.membershipStatus)
  const days = daysUntil(member?.membershipExpiryDate)
  const expPct = (() => {
    if (!member?.membershipExpiryDate || !member?.createdAt) return 0
    const start = new Date(member.createdAt).getTime()
    const end = new Date(member.membershipExpiryDate).getTime()
    const now = Date.now()
    const elapsed = now - start
    const total = end - start
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
  })()

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <h1 className="text-xl font-bold tracking-tight">Membership</h1>

      {/* Current plan card */}
      {member && (
        <div className="flex flex-col gap-4 p-6 card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-widest uppercase text-muted">Current plan</p>
              <p className="mt-1 text-xl font-black">{member.currentPlanId?.name || 'No active plan'}</p>
            </div>
            <Badge color={badgeColor}>{badgeLabel}</Badge>
          </div>

          {/* Progress bar */}
          {member.membershipStatus === 'active' && (
            <div>
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>Plan usage</span>
                <span>{expPct}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${expPct > 80 ? 'bg-yellow-400' : 'bg-lime'}`}
                  style={{ width: `${expPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
            <div>
              <p className="text-xs text-muted">Valid until</p>
              <p className="font-semibold text-sm mt-0.5">{fmt(member.membershipExpiryDate)}</p>
            </div>
            {days !== null && (
              <div>
                <p className="text-xs text-muted">{days > 0 ? 'Days remaining' : 'Days overdue'}</p>
                <p className={`font-semibold text-sm mt-0.5 ${days <= 7 && days > 0 ? 'text-yellow-400' : days <= 0 ? 'text-red-400' : ''}`}>
                  {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            {member.currentPlan?.price && (
              <div>
                <p className="text-xs text-muted">Plan price</p>
                <p className="font-semibold text-sm mt-0.5">₹{member.currentPlan.price.toLocaleString('en-IN')}</p>
              </div>
            )}
            {member.currentPlan?.durationDays && (
              <div>
                <p className="text-xs text-muted">Duration</p>
                <p className="font-semibold text-sm mt-0.5">{member.currentPlan.durationDays} days</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All available plans */}
      <div>
        <h2 className="mb-3 text-base font-bold">Available plans</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : plans.length === 0 ? (
          <EmptyState icon="📋" title="No plans listed" sub="Your gym hasn't published any plans yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map((plan) => {
              const isCurrent = plan._id === member?.currentPlan?._id ||
                plan._id === member?.currentPlan
              return (
                <div key={plan._id}
                  className={`card p-5 flex flex-col gap-2 ${isCurrent ? 'border-lime/30 bg-lime/5' : ''}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{plan.name}</h3>
                    {isCurrent && <Badge color="lime">Your plan</Badge>}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black">₹{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-muted">incl. GST</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted pt-2 border-t border-white/[0.06]">
                    <span>📅 {plan.durationDays} days</span>
                    {plan.sessionsIncluded > 0 && (
                      <span>💪 {plan.sessionsIncluded} PT sessions</span>
                    )}
                    {plan.sessionsIncluded === 0 && (
                      <span>♾️ Unlimited gym access</span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-xs text-muted">{plan.description}</p>
                  )}
                  {!isCurrent && (
                    <p className="mt-1 text-xs text-lime/60">Contact your gym to switch to this plan</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
