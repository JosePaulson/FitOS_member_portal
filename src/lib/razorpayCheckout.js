const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

let loadPromise = null

/** Lazily injects Razorpay's Checkout script — loaded once, on first use. */
function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.onload = () => resolve()
    script.onerror = () => {
      loadPromise = null // allow retrying on a later attempt
      reject(new Error('Could not load the payment gateway. Check your connection and try again.'))
    }
    document.body.appendChild(script)
  })

  return loadPromise
}

/**
 * Opens Razorpay Checkout for an order created by the backend.
 *
 * @param {object} order          - { orderId, amount, currency, keyId } from the create-order response
 * @param {object} opts
 * @param {string} opts.name        - shown at the top of Checkout (gym name)
 * @param {string} opts.description - what the payment is for
 * @param {object} opts.prefill     - { name, contact, email }
 * @param {(response: {razorpay_order_id, razorpay_payment_id, razorpay_signature}) => void} opts.onSuccess
 * @param {() => void} [opts.onDismiss] - modal closed without completing payment
 */
export async function openRazorpayCheckout(order, { name, description, prefill, onSuccess, onDismiss }) {
  await loadRazorpayScript()

  const rzp = new window.Razorpay({
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name,
    description,
    prefill,
    theme: { color: '#C8F135' },
    handler: (response) => onSuccess(response),
    modal: {
      ondismiss: () => onDismiss?.(),
    },
    // Explicitly show UPI, cards, wallets and netbanking (in that order)
    // instead of relying on whatever's enabled by default on the account.
    config: {
      display: {
        blocks: {
          methods: {
            name: 'Pay via UPI, card, wallet or netbanking',
            instruments: [
              { method: 'upi' },
              { method: 'card' },
              { method: 'wallet' },
              { method: 'netbanking' },
            ],
          },
        },
        sequence: ['block.methods'],
        preferences: { show_default_blocks: false },
      },
    },
  })

  rzp.on('payment.failed', () => {
    // Razorpay already shows its own failure UI inside the modal and lets
    // the member retry without closing it — nothing to do here.
  })

  rzp.open()
}
