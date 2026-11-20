import { useEffect, useState } from 'react'
import { portalApi } from '../api/index'
import { useMemberAuth } from '../context/MemberAuthContext'

/**
 * "Refer a friend" card. Renders nothing unless the gym has switched the
 * programme on, so gyms that don't use it never see an empty/odd card.
 */
export default function ReferralCard() {
  const { gym } = useMemberAuth()
  const [info, setInfo] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    portalApi.referral()
      .then(({ data }) => setInfo(data))
      .catch(() => setInfo(null)) // offline / error: just don't show the card
  }, [])

  if (!info?.enabled || !info.code) return null

  const gymName = gym?.name || 'my gym'
  const message =
    `Join ${gymName}! Use my referral code ${info.code} when you sign up` +
    (info.refereeDiscountPercent > 0 ? ` and get ${info.refereeDiscountPercent}% off your first membership.` : '.')

  async function copy() {
    try { await navigator.clipboard.writeText(info.code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { window.prompt('Your referral code:', info.code) }
  }

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ text: message }); return } catch { /* cancelled — fall through to WhatsApp */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener')
  }

  return (
    <div className="p-5 rounded-2xl"
      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
      <p className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--color-secondary)' }}>Refer a friend 🎁</p>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-primary)' }}>
        {info.refereeDiscountPercent > 0 && <>Your friend gets <b>{info.refereeDiscountPercent}% off</b> their first membership. </>}
        {info.referrerRewardDays > 0 && <>You get <b>{info.referrerRewardDays} free day{info.referrerRewardDays === 1 ? '' : 's'}</b> once they join and pay.</>}
      </p>

      <div className="flex items-center justify-between px-4 py-3 mt-4 rounded-xl"
        style={{ border: '1px dashed var(--color-border)' }}>
        <span className="text-xl font-black tracking-[0.25em]" style={{ color: 'var(--color-accent)' }}>{info.code}</span>
        <button onClick={copy} className="text-xs font-semibold" style={{ color: 'var(--color-secondary)' }}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>

      <button onClick={share}
        className="w-full py-2.5 mt-3 text-sm font-bold rounded-xl"
        style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
        Share with a friend
      </button>

      {info.referred > 0 && (
        <p className="mt-3 text-xs text-center" style={{ color: 'var(--color-secondary)' }}>
          {info.referred} friend{info.referred === 1 ? '' : 's'} joined with your code
          {info.rewarded > 0 && ` · ${info.rewarded} reward${info.rewarded === 1 ? '' : 's'} earned`}
        </p>
      )}
    </div>
  )
}
