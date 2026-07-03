import { useEffect, useState } from 'react'
import { portalApi } from '../api/index'
import Spinner, { Badge, invoiceBadge, EmptyState } from '../components/ui/Spinner'

function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Billing() {
  const [invoices, setInvoices] = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  const LIMIT = 8

  useEffect(() => {
    setLoading(true)
    portalApi.invoices({ page, limit: LIMIT })
      .then(({ data }) => { setInvoices(data.invoices); setTotal(data.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  if (selected) return <InvoiceDetail invoice={selected} onBack={() => setSelected(null)} />

  return (
    <div className="px-5 py-6 flex flex-col gap-5">
      <h1 className="text-xl font-bold tracking-tight">Billing</h1>

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
                  className="card p-4 flex items-center justify-between text-left hover:border-lime/20 transition-all w-full">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono text-muted">{inv.invoiceNumber}</span>
                    <span className="font-semibold text-sm">{inv.planId?.name || 'Membership'}</span>
                    <span className="text-xs text-muted">{fmt(inv.createdAt)}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-bold text-lg">₹{inv.totalAmount?.toLocaleString('en-IN')}</span>
                    <Badge color={color}>{label}</Badge>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex justify-between items-center pt-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="text-sm text-muted disabled:opacity-40 hover:text-cream transition-colors">
                ← Prev
              </button>
              <span className="text-xs text-muted">{page} / {Math.ceil(total / LIMIT)}</span>
              <button disabled={page * LIMIT >= total} onClick={() => setPage((p) => p + 1)}
                className="text-sm text-muted disabled:opacity-40 hover:text-cream transition-colors">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function InvoiceDetail({ invoice, onBack }) {
  const [color, label] = invoiceBadge(invoice.status)

  return (
    <div className="px-5 py-6 flex flex-col gap-5">
      <button onClick={onBack} className="flex items-center gap-2 text-muted hover:text-cream transition-colors text-sm">
        ← Back to billing
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Invoice</h1>
          <p className="text-xs font-mono text-muted mt-0.5">{invoice.invoiceNumber}</p>
        </div>
        <Badge color={color}>{label}</Badge>
      </div>

      {/* Amount card */}
      <div className="card p-6 text-center">
        <p className="text-muted text-sm mb-1">Total paid</p>
        <p className="text-4xl font-black tracking-tight">₹{invoice.totalAmount?.toLocaleString('en-IN')}</p>
        {invoice.status === 'paid' && invoice.paidAt && (
          <p className="text-xs text-lime mt-2">✓ Paid on {new Date(invoice.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
      </div>

      {/* Breakdown */}
      <div className="card p-5 flex flex-col divide-y divide-white/[0.06]">
        {[
          { label: 'Plan',          value: invoice.planId?.name || 'Membership' },
          { label: 'Invoice date',  value: new Date(invoice.createdAt).toLocaleDateString('en-IN') },
          { label: 'Base amount',   value: `₹${invoice.baseAmount?.toLocaleString('en-IN')}` },
          { label: `GST (${invoice.taxRate}%)`, value: `₹${invoice.taxAmount?.toLocaleString('en-IN')}` },
          { label: 'Total',         value: `₹${invoice.totalAmount?.toLocaleString('en-IN')}`, bold: true },
          ...(invoice.paymentMethod ? [{ label: 'Payment method', value: invoice.paymentMethod }] : []),
        ].map(({ label, value, bold }) => (
          <div key={label} className="flex justify-between py-3 text-sm first:pt-0 last:pb-0">
            <span className="text-muted">{label}</span>
            <span className={bold ? 'font-bold text-cream' : 'font-medium'}>{value}</span>
          </div>
        ))}
      </div>

      {invoice.pdfUrl && (
        <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer"
          className="w-full bg-lime text-black font-bold py-3 rounded-xl text-sm text-center hover:bg-lime-dark transition-all">
          Download PDF invoice
        </a>
      )}

      {invoice.status === 'pending' && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-3 text-xs text-yellow-400">
          💳 Payment pending — contact your gym to complete payment
        </div>
      )}
    </div>
  )
}
