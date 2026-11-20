import { useMemberAuth } from '../context/MemberAuthContext'
import { usePayment } from '../hooks/usePayment'
import { paymentApi } from '../api/index'
import Spinner from './ui/Spinner'
import AutoRenewToggle from './AutoRenewToggle'

/**
 * One-tap renewal on Home: shows up in the last 7 days of a membership (and
 * after it ends) and goes straight to the payment sheet for the member's
 * current plan. Hidden while on hold, or if the plan details aren't available.
 */
export default function RenewCard() {
  const { member } = useMemberAuth()
  const { pay, error, isProcessing } = usePayment()

  const plan = member?.currentPlanId
  if (!plan || typeof plan !== 'object' || !plan.price || !member.membershipExpiryDate) return null
  if (member.membershipStatus === 'paused') return null

  const daysLeft = Math.ceil((new Date(member.membershipExpiryDate) - Date.now()) / 86_400_000)
  const expired = member.membershipStatus === 'expired' || daysLeft < 0
  if (!expired && daysLeft > 7) return null

  const headline = expired ? 'Your membership has ended'
    : daysLeft <= 0 ? 'Your membership ends today'
    : `Your membership ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`

  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl"
      style={{ background: expired ? 'rgba(248,113,113,0.08)' : 'rgba(200,241,53,0.08)', border: `1px solid ${expired ? 'rgba(248,113,113,0.25)' : 'rgba(200,241,53,0.25)'}` }}>
      <div>
        <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{headline}</p>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-secondary)' }}>
          {expired ? 'Renew to get back in.' : 'Renew now — any days you have left are carried over.'}
        </p>
      </div>
      <button
        onClick={() => pay(() => paymentApi.membershipCheckout(plan._id), { description: `${plan.name} — Renewal` })}
        disabled={isProcessing}
        className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold rounded-xl disabled:opacity-60"
        style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
        {isProcessing && <Spinner size="sm" />}
        {isProcessing ? 'Processing…' : `Renew ${plan.name} — ₹${plan.price.toLocaleString('en-IN')}`}
      </button>
      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
      <AutoRenewToggle compact />
    </div>
  )
}
