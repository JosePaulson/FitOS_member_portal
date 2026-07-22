import { useCallback, useState } from 'react'
import { paymentApi } from '../api/index'
import { openRazorpayCheckout } from '../lib/razorpayCheckout'
import { useMemberAuth } from '../context/MemberAuthContext'
import { isNetworkError } from '../lib/offline'

/**
 * Drives the full online-payment flow: calls whichever create-order
 * endpoint the caller supplies, opens Razorpay Checkout with the result,
 * then verifies the payment server-side once Checkout succeeds.
 *
 * One hook instance is meant to be shared across a whole page (Billing,
 * Plans) so only one payment can be in flight at a time — track *which*
 * item is being paid locally in the page (e.g. the invoice/plan id) and
 * gate individual buttons with `isProcessing`.
 */
export function usePayment() {
  const { member, gym, refreshMember } = useMemberAuth()
  const [status, setStatus] = useState('idle') // idle | processing | verifying | error
  const [error, setError] = useState('')

  const reset = useCallback(() => {
    setStatus('idle')
    setError('')
  }, [])

  /**
   * @param {() => Promise} createOrder - e.g. () => paymentApi.payInvoice(id)
   * @param {object} opts
   * @param {string} opts.description
   * @param {(result: { invoice, member, ptPlan }) => void} [opts.onSuccess]
   */
  const pay = useCallback(async (createOrder, { description, onSuccess } = {}) => {
    setStatus('processing')
    setError('')
    try {
      const { data: order } = await createOrder()

      await openRazorpayCheckout(order, {
        name: gym?.name || 'FitOS',
        description,
        prefill: { name: member?.name, contact: member?.phone, email: member?.email },
        onSuccess: async (response) => {
          setStatus('verifying')
          try {
            const { data } = await paymentApi.verify(response)
            await refreshMember()
            setStatus('idle')
            onSuccess?.(data)
          } catch (err) {
            setStatus('error')
            setError(
              isNetworkError(err)
                ? 'Payment went through, but we couldn\u2019t confirm it here — it\u2019ll update automatically once you\u2019re back online.'
                : (err.response?.data?.message || 'We couldn\u2019t confirm your payment here — it\u2019ll be reflected shortly, or check with your gym.')
            )
          }
        },
        onDismiss: () => setStatus((s) => (s === 'processing' ? 'idle' : s)),
      })
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.message || 'Could not start payment. Please try again.')
    }
  }, [gym, member, refreshMember])

  return { status, error, pay, reset, isProcessing: status === 'processing' || status === 'verifying' }
}
