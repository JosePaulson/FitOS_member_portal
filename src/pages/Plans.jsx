import { useEffect, useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { portalApi } from '../api/index'
import Spinner, { Badge, membershipBadge, EmptyState } from '../components/ui/Spinner'

function fmt(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' }
function daysUntil(d) { return d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null }

export default function Plans() {
  const { member } = useMemberAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  const [ptCatalog, setPtCatalog] = useState(null)
  const [myPtPlans, setMyPtPlans] = useState([])
  const [ptLoading, setPtLoading] = useState(true)

  useEffect(() => {
    portalApi.plans().then(({ data }) => setPlans(data)).catch(() => { }).finally(() => setLoading(false))
    Promise.all([portalApi.ptPlanCatalog(), portalApi.ptPlans()])
      .then(([catalogRes, myRes]) => {
        setPtCatalog(catalogRes.data)
        setMyPtPlans(myRes.data.plans || [])
      })
      .catch(() => { })
      .finally(() => setPtLoading(false))
  }, [])

  const activePtPlan = myPtPlans.find((p) => p.status === 'active')

  const [badgeColor, badgeLabel] = membershipBadge(member?.membershipStatus)
  const days = daysUntil(member?.membershipExpiryDate)
  const expPct = (() => {
    if (!member?.membershipExpiryDate || !member?.createdAt) return 0
    const start = new Date(member.createdAt).getTime()
    const end = new Date(member.membershipExpiryDate).getTime()
    return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)))
  })()

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>Membership</h1>

      {/* Current plan */}
      {member && (
        <div className="flex flex-col gap-4 p-6 card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--color-secondary)' }}>Current plan</p>
              <p className="mt-1 text-xl font-black" style={{ color: 'var(--color-primary)' }}>{member.currentPlanId?.name || 'No active plan'}</p>
            </div>
            <Badge color={badgeColor}>{badgeLabel}</Badge>
          </div>

          {member.membershipStatus === 'active' && (
            <div>
              <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-secondary)' }}>
                <span>Plan usage</span><span>{expPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--color-surface-3)' }}>
                <div className="h-2 transition-all rounded-full" style={{ width: `${expPct}%`, background: expPct > 80 ? '#fbbf24' : 'var(--color-accent)' }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            {[
              { label: 'Valid until', value: fmt(member.membershipExpiryDate) },
              {
                label: days !== null ? (days > 0 ? 'Days remaining' : 'Days overdue') : null,
                value: days !== null ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}` : null,
                warn: days !== null && days <= 7
              },
              { label: 'Plan price', value: member.currentPlan?.price ? `₹${member.currentPlan.price.toLocaleString('en-IN')}` : null },
              { label: 'Duration', value: member.currentPlan?.durationDays ? `${member.currentPlan.durationDays} days` : null },
            ].filter((r) => r.label && r.value).map(({ label, value, warn }) => (
              <div key={label}>
                <p className="text-xs mb-0.5" style={{ color: 'var(--color-secondary)' }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color: warn ? '#fbbf24' : 'var(--color-primary)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All plans */}
      <div>
        <h2 className="mb-3 text-base font-bold" style={{ color: 'var(--color-primary)' }}>Available plans</h2>
        {loading ? <div className="flex justify-center py-8"><Spinner /></div>
          : plans.length === 0 ? <EmptyState icon="📋" title="No plans listed" sub="Your gym hasn't published any plans yet." />
            : (
              <div className="flex flex-col gap-3">
                {plans.map((plan) => {
                  const isCurrent = plan._id === member?.currentPlan?._id || plan._id === member?.currentPlan
                  return (
                    <div key={plan._id} className="flex flex-col gap-2 p-5 card"
                      style={isCurrent ? { borderColor: 'rgba(200,241,53,0.3)', background: 'rgba(200,241,53,0.04)' } : {}}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold" style={{ color: 'var(--color-primary)' }}>{plan.name}</h3>
                        {isCurrent && <Badge color="lime">Your plan</Badge>}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black" style={{ color: 'var(--color-primary)' }}>₹{plan.price.toLocaleString('en-IN')}</span>
                        <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>incl. GST</span>
                      </div>
                      <div className="flex gap-4 pt-2 text-xs" style={{ color: 'var(--color-secondary)', borderTop: '1px solid var(--color-border)' }}>
                        <span>📅 {plan.durationDays} days</span>
                        {plan.sessionsIncluded > 0 ? <span>💪 {plan.sessionsIncluded} PT</span> : <span>♾️ Unlimited</span>}
                      </div>
                      {plan.description && <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>{plan.description}</p>}
                      {!isCurrent && <p className="text-xs" style={{ color: 'rgba(200,241,53,0.6)' }}>Contact your gym to switch</p>}
                    </div>
                  )
                })}
              </div>
            )
        }
      </div>

      {/* PT plans — independent of membership, entirely optional */}
      <div>
        <h2 className="mb-3 text-base font-bold" style={{ color: 'var(--color-primary)' }}>Personal training plans</h2>
        {ptLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <div className="flex flex-col gap-3">
            {activePtPlan ? (
              <div className="flex flex-col gap-2 p-5 card" style={{ borderColor: 'rgba(147,51,234,0.35)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold" style={{ color: 'var(--color-primary)' }}>{activePtPlan.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(147,51,234,0.15)', color: '#c084fc' }}>YOUR PLAN</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                  {activePtPlan.classesUsed} / {activePtPlan.classesTotal} classes used · expires {fmt(activePtPlan.expiryDate)}
                </p>
              </div>
            ) : (
              <div className="p-5 text-center card">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>No PT plan available</p>
                {ptCatalog?.startingAtPerSession != null && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-secondary)' }}>
                    PT plans at {ptCatalog.gymName || 'your gym'} start at ₹{ptCatalog.startingAtPerSession.toLocaleString('en-IN')}/session
                  </p>
                )}
              </div>
            )}

            {ptCatalog?.plans?.length > 0 && (
              <div className="flex flex-col gap-3">
                {ptCatalog.plans.map((p) => (
                  <div key={p._id} className="flex flex-col gap-2 p-5 card">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold" style={{ color: 'var(--color-primary)' }}>{p.name}</h3>
                      {p.target && <Badge color="lime">{p.target}</Badge>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black" style={{ color: 'var(--color-primary)' }}>₹{p.fee.toLocaleString('en-IN')}</span>
                      <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>total</span>
                    </div>
                    <div className="flex gap-4 pt-2 text-xs" style={{ color: 'var(--color-secondary)', borderTop: '1px solid var(--color-border)' }}>
                      <span>💪 {p.numberOfClasses} classes</span>
                      <span>📅 {p.durationDays} days validity</span>
                      {p.trainerId?.name && <span>🏋️ {p.trainerId.name}</span>}
                    </div>
                    {p.description && <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>{p.description}</p>}
                    <p className="text-xs" style={{ color: 'rgba(200,241,53,0.6)' }}>Ask your trainer or the front desk to get this assigned</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}