import { useEffect, useState } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'
import { portalApi, paymentApi } from '../api/index'
import Spinner, { Badge, membershipBadge, EmptyState } from '../components/ui/Spinner'
import { usePayment } from '../hooks/usePayment'

function fmt(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—' }
function daysUntil(d) { return d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null }

function Category({ label, children }) {
  return (
    <div className="mb-5 last:mb-0">
      <h3 className="mb-3 text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--color-secondary)' }}>{label}</h3>
      {children}
    </div>
  )
}

function ExpiryWarning({ label, days }) {
  const expired = days !== null && days <= 0
  return (
    <div
      className="px-4 py-3 text-xs font-semibold rounded-xl"
      style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}
    >
      ⚠️ {expired
        ? `Your current ${label} has expired`
        : `Your current ${label} is going to expire in ${days} day${days === 1 ? '' : 's'}`}
    </div>
  )
}

export default function Plans() {
  const { member } = useMemberAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  const [ptCatalog, setPtCatalog] = useState(null)
  const [myPtPlans, setMyPtPlans] = useState([])
  const [ptLoading, setPtLoading] = useState(true)

  // null while we haven't heard back yet — avoids flashing the wrong state
  const [paymentsEnabled, setPaymentsEnabled] = useState(null)
  const { pay, status, error, isProcessing } = usePayment()
  const [payingKey, setPayingKey] = useState(null) // which specific button is mid-payment

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

  useEffect(() => {
    paymentApi.config()
      .then(({ data }) => setPaymentsEnabled(data.enabled))
      .catch(() => setPaymentsEnabled(false))
  }, [])

  function payMembership(plan) {
    setPayingKey(`membership:${plan._id}`)
    pay(() => paymentApi.membershipCheckout(plan._id), {
      description: `${plan.name} — Membership`,
      // member (currentPlanId/dates) refreshes automatically inside usePayment
    })
  }

  function payPT(plan) {
    setPayingKey(`pt:${plan._id}`)
    pay(() => paymentApi.ptCheckout(plan._id), {
      description: `${plan.name} — PT Plan`,
      onSuccess: () => {
        portalApi.ptPlans().then(({ data }) => setMyPtPlans(data.plans || [])).catch(() => { })
      },
    })
  }

  function payLabel(key, fallback) {
    if (payingKey !== key) return fallback
    if (status === 'processing') return 'Opening payment…'
    if (status === 'verifying') return 'Confirming…'
    return fallback
  }
  const busy = (key) => payingKey === key && isProcessing

  const activePtPlan = myPtPlans.find((p) => p.status === 'active')

  const [badgeColor, badgeLabel] = membershipBadge(member?.membershipStatus)
  const days = daysUntil(member?.membershipExpiryDate)
  const expPct = (() => {
    if (!member?.membershipExpiryDate || !member?.createdAt) return 0
    const start = new Date(member.createdAt).getTime()
    const end = new Date(member.membershipExpiryDate).getTime()
    return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)))
  })()

  // Online purchase buttons only need to show up when there's actually a
  // reason to buy right now: no membership/PT plan yet (first purchase), or
  // the existing one is within its last 3 days (or already lapsed). A
  // member with weeks left on an active plan doesn't need a "buy" button
  // in their face — it just invites accidental double-charges.
  const EXPIRY_WINDOW_DAYS = 3
  const hasActiveMembership = member?.membershipStatus === 'active' && !!member?.currentPlanId
  const membershipExpiringSoon = hasActiveMembership && days !== null && days <= EXPIRY_WINDOW_DAYS
  const showMembershipButtons = !hasActiveMembership || membershipExpiringSoon

  const ptDays = daysUntil(activePtPlan?.expiryDate)
  const ptExpiringSoon = !!activePtPlan && ptDays !== null && ptDays <= EXPIRY_WINDOW_DAYS
  const showPtButtons = !activePtPlan || ptExpiringSoon

  return (
    <div className="flex flex-col gap-8 px-5 py-6">
      <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>Membership</h1>

      {/* ══════════ YOUR PLANS ══════════ */}
      <div>
        <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Your Plans</h2>

        <Category label="Membership">
          {member?.currentPlanId || member?.membershipStatus ? (
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
                  { label: 'Plan price', value: member.currentPlanId?.price ? `₹${member.currentPlanId.price.toLocaleString('en-IN')}` : null },
                  { label: 'Duration', value: member.currentPlanId?.durationDays ? `${member.currentPlanId.durationDays} days` : null },
                ].filter((r) => r.label && r.value).map(({ label, value, warn }) => (
                  <div key={label}>
                    <p className="text-xs mb-0.5" style={{ color: 'var(--color-secondary)' }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: warn ? '#fbbf24' : 'var(--color-primary)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {membershipExpiringSoon && (
                <ExpiryWarning label="membership plan" days={days} />
              )}

              {paymentsEnabled && member.currentPlanId && membershipExpiringSoon && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <button onClick={() => payMembership(member.currentPlanId)} disabled={isProcessing}
                    className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold transition-all rounded-lg disabled:opacity-60"
                    style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
                    {busy(`membership:${member.currentPlanId._id}`) && <Spinner size="sm" />}
                    {payLabel(`membership:${member.currentPlanId._id}`, `Renew now — ₹${member.currentPlanId.price?.toLocaleString('en-IN')}`)}
                  </button>
                  {payingKey === `membership:${member.currentPlanId._id}` && error && (
                    <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <EmptyState icon="📋" title="No active membership" sub="Talk to the front desk to get one set up." />
          )}
        </Category>

        <Category label="Personal Training">
          {ptLoading ? <div className="flex justify-center py-6"><Spinner /></div> : activePtPlan ? (
            <div className="flex flex-col gap-2 p-5 card" style={{ borderColor: 'rgba(147,51,234,0.35)' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold" style={{ color: 'var(--color-primary)' }}>{activePtPlan.name}</h3>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(147,51,234,0.15)', color: '#c084fc' }}>YOUR PLAN</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                {activePtPlan.classesUsed} / {activePtPlan.classesTotal} classes used · expires {fmt(activePtPlan.expiryDate)}
              </p>
              {ptExpiringSoon && (
                <div className="pt-1">
                  <ExpiryWarning label="PT plan" days={ptDays} />
                </div>
              )}
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
        </Category>
      </div>

      {/* ══════════ AVAILABLE PLANS ══════════ */}
      <div>
        <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Available Plans</h2>

        <Category label="Membership">
          {loading ? <div className="flex justify-center py-6"><Spinner /></div>
            : plans.length === 0 ? <EmptyState icon="📋" title="No plans listed" sub="Your gym hasn't published any plans yet." />
              : (
                <div className="flex flex-col gap-3">
                  {plans.map((plan) => {
                    const isCurrent = plan._id === member?.currentPlanId?._id
                    const key = `membership:${plan._id}`
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
                        {!isCurrent && showMembershipButtons && (
                          paymentsEnabled ? (
                            <div className="flex flex-col gap-1.5 pt-1">
                              <button onClick={() => payMembership(plan)} disabled={isProcessing}
                                className="flex items-center justify-center w-full gap-2 py-2.5 text-sm font-bold transition-all rounded-lg disabled:opacity-60"
                                style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
                                {busy(key) && <Spinner size="sm" />}
                                {payLabel(key, `Buy this plan — ₹${plan.price.toLocaleString('en-IN')}`)}
                              </button>
                              {payingKey === key && error && (
                                <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>
                              )}
                            </div>
                          ) : paymentsEnabled === false ? (
                            <p className="text-xs" style={{ color: 'rgba(200,241,53,0.6)' }}>Contact your gym to switch</p>
                          ) : null
                        )}
                      </div>
                    )
                  })}
                </div>
              )
          }
        </Category>

        <Category label="Personal Training">
          {ptLoading ? <div className="flex justify-center py-6"><Spinner /></div>
            : !ptCatalog?.plans?.length ? <EmptyState icon="💪" title="No PT plans listed" sub="Your gym hasn't published any PT plans yet." />
              : (
                <div className="flex flex-col gap-3">
                  {ptCatalog.plans.map((p) => {
                    const key = `pt:${p._id}`
                    return (
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
                        {showPtButtons && (
                          paymentsEnabled ? (
                            <div className="flex flex-col gap-1.5 pt-1">
                              <button onClick={() => payPT(p)} disabled={isProcessing}
                                className="flex items-center justify-center w-full gap-2 py-2.5 text-sm font-bold transition-all rounded-lg disabled:opacity-60"
                                style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
                                {busy(key) && <Spinner size="sm" />}
                                {payLabel(key, `Buy — ₹${p.fee.toLocaleString('en-IN')}`)}
                              </button>
                              {payingKey === key && error && (
                                <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>
                              )}
                            </div>
                          ) : paymentsEnabled === false ? (
                            <p className="text-xs" style={{ color: 'rgba(200,241,53,0.6)' }}>Ask your trainer or the front desk to get this assigned</p>
                          ) : null
                        )}
                      </div>
                    )
                  })}
                </div>
              )
          }
        </Category>
      </div>
    </div>
  )
}
