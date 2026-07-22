import { useEffect, useState, useCallback } from 'react'
import { portalApi, paymentApi } from '../api/index'
import Spinner, { Badge, invoiceBadge, EmptyState } from '../components/ui/Spinner'
import { usePayment } from '../hooks/usePayment'
import { useBackableState } from '../hooks/useBackableState'

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function planNameOf(invoice) {
  return invoice.planId?.name || invoice.ptPlanId?.name || 'Membership'
}

export default function Billing() {
  const [invoices, setInvoices] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  // null while we haven't heard back yet — avoids flashing the wrong state
  const [paymentsEnabled, setPaymentsEnabled] = useState(null)
  const LIMIT = 8

  useEffect(() => {
    setLoading(true)
    portalApi.invoices({ page, limit: LIMIT })
      .then(({ data }) => { setInvoices(data.invoices); setTotal(data.total) })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    paymentApi.config()
      .then(({ data }) => setPaymentsEnabled(data.enabled))
      .catch(() => setPaymentsEnabled(false))
  }, [])

  // Called after a successful online payment — updates both the open
  // detail view and the list, without a full refetch.
  const handlePaid = useCallback((updatedInvoice) => {
    setSelected(updatedInvoice)
    setInvoices((prev) => prev.map((i) => (i._id === updatedInvoice._id ? updatedInvoice : i)))
  }, [])

  // Back button (or the in-app "← Back to billing" button) closes the
  // invoice detail and returns to the list, instead of leaving Billing
  // entirely — same pattern used for workout/PT/diet detail views.
  const closeSelected = useBackableState(selected, () => setSelected(null))

  if (selected) {
    return (
      <InvoiceDetail
        invoice={selected}
        onBack={closeSelected}
        paymentsEnabled={paymentsEnabled}
        onPaid={handlePaid}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>Billing</h1>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : invoices.length === 0 ? (
        <EmptyState icon="🧾" title="No invoices yet" sub="Your payment history will appear here." />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {invoices.map((inv) => {
              const [color, label] = invoiceBadge(inv.status)
              return (
                <button key={inv._id} onClick={() => setSelected(inv)}
                  className="flex items-center justify-between w-full p-4 text-left transition-all card"
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(200,241,53,0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs" style={{ color: 'var(--color-secondary)' }}>{inv.invoiceNumber}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{planNameOf(inv)}</span>
                    <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>{fmt(inv.createdAt)}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>₹{inv.totalAmount?.toLocaleString('en-IN')}</span>
                    <Badge color={color}>{label}</Badge>
                  </div>
                </button>
              )
            })}
          </div>
          {total > LIMIT && (
            <div className="flex items-center justify-between pt-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="text-sm transition-colors disabled:opacity-40"
                style={{ color: 'var(--color-secondary)' }}>← Prev</button>
              <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>{page} / {Math.ceil(total / LIMIT)}</span>
              <button disabled={page * LIMIT >= total} onClick={() => setPage((p) => p + 1)}
                className="text-sm transition-colors disabled:opacity-40"
                style={{ color: 'var(--color-secondary)' }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function InvoiceDetail({ invoice, onBack, paymentsEnabled, onPaid }) {
  const [color, label] = invoiceBadge(invoice.status)
  const { pay, status, error, isProcessing } = usePayment()
  const planName = planNameOf(invoice)

  function handlePay() {
    pay(() => paymentApi.payInvoice(invoice._id), {
      description: `${planName} — ${invoice.invoiceNumber}`,
      onSuccess: (data) => onPaid(data.invoice),
    })
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: 'var(--color-secondary)' }}>← Back to billing</button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>Invoice</h1>
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-secondary)' }}>{invoice.invoiceNumber}</p>
        </div>
        <Badge color={color}>{label}</Badge>
      </div>

      <div className="p-6 text-center card">
        <p className="mb-1 text-sm" style={{ color: 'var(--color-secondary)' }}>
          {invoice.status === 'paid' ? 'Total paid' : 'Amount due'}
        </p>
        <p className="text-4xl font-black tracking-tight" style={{ color: 'var(--color-primary)' }}>
          ₹{invoice.totalAmount?.toLocaleString('en-IN')}
        </p>
        {invoice.status === 'paid' && invoice.paidAt && (
          <p className="mt-2 text-xs" style={{ color: 'var(--color-accent)' }}>
            ✓ Paid on {new Date(invoice.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      <div className="flex flex-col p-5 card" style={{ gap: 0 }}>
        {[
          { label: 'Plan', value: planName },
          { label: 'Invoice date', value: new Date(invoice.createdAt).toLocaleDateString('en-IN') },
          { label: 'Base amount', value: `₹${invoice.baseAmount?.toLocaleString('en-IN')}` },
          { label: `GST (${invoice.taxRate}%)`, value: `₹${invoice.taxAmount?.toLocaleString('en-IN')}` },
          { label: 'Total', value: `₹${invoice.totalAmount?.toLocaleString('en-IN')}`, bold: true },
          ...(invoice.paymentMethod ? [{ label: 'Payment method', value: invoice.paymentMethod }] : []),
        ].map(({ label, value, bold }, i) => (
          <div key={label} className="flex justify-between py-3 text-sm"
            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-secondary)' }}>{label}</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: bold ? 700 : 500 }}>{value}</span>
          </div>
        ))}
      </div>

      {invoice.pdfUrl && (
        <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer"
          className="block w-full py-3 text-sm font-bold text-center transition-all rounded-xl"
          style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
          Download PDF invoice
        </a>
      )}

      {invoice.status === 'pending' && (
        paymentsEnabled ? (
          <div className="flex flex-col gap-2">
            <button onClick={handlePay} disabled={isProcessing}
              className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold text-center transition-all rounded-xl disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
              {isProcessing && <Spinner size="sm" />}
              {status === 'processing' ? 'Opening payment…'
                : status === 'verifying' ? 'Confirming payment…'
                : `Pay ₹${invoice.totalAmount?.toLocaleString('en-IN')} now`}
            </button>
            <p className="text-[11px] text-center" style={{ color: 'var(--color-secondary)' }}>
              Secured by Razorpay · UPI, cards, wallets & netbanking
            </p>
            {error && (
              <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>
            )}
          </div>
        ) : paymentsEnabled === false ? (
          <div className="px-4 py-3 text-xs rounded-xl"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
            💳 Payment pending — contact your gym to complete payment
          </div>
        ) : null
      )}
    </div>
  )
}
