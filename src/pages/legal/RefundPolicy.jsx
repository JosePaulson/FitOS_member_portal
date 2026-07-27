import LegalPageShell, { H2, P, Ul } from '../../components/legal/LegalPageShell'

export default function RefundPolicy() {
  return (
    <LegalPageShell title="Refund Policy" updated="26 July 2026">
      <P>
        This policy covers payments made through the FitOS Member Portal — for example,
        membership plan purchases/renewals or PT session packages paid for in-app via
        Razorpay.
      </P>

      <H2>All payments are final — no refunds</H2>
      <P>
        Once a payment for a membership plan, PT session, or any other purchase is
        successfully processed through the App, it is <strong>final and
        non-refundable</strong>. This applies regardless of the reason, including but
        not limited to:
      </P>
      <Ul>
        <li>Change of mind after purchase.</li>
        <li>Not using, or partially using, a plan or PT session package you've paid for.</li>
        <li>Ending your gym membership early or discontinuing visits.</li>
        <li>Missed sessions, classes, or bookings.</li>
        <li>Dissatisfaction with your gym's facilities, staff, or services (these are your gym's responsibility, not FitOS's).</li>
      </Ul>
      <P>
        We also don't offer partial refunds, credits, or pro-rated adjustments for
        unused portions of a plan.
      </P>

      <H2>Cancellations</H2>
      <P>
        You may be able to stop future auto-renewals (where offered) by contacting your
        gym, but this does not entitle you to a refund for amounts already charged.
      </P>

      <H2>Narrow exceptions</H2>
      <P>We will investigate and correct, where applicable, cases of:</P>
      <Ul>
        <li><strong>Duplicate charges</strong> — you were charged more than once for the same purchase.</li>
        <li><strong>Erroneous charges</strong> — a technical error resulted in an incorrect amount being charged.</li>
      </Ul>
      <P>
        To report either, contact us within 7 days of the charge at{' '}
        <a href="mailto:info@f8os.in" className="underline">info@f8os.in</a> with your
        payment reference. Verified duplicate/erroneous charges will be reversed to
        your original payment method; this is a correction of an error, not a
        discretionary refund.
      </P>

      <H2>Failed or incomplete transactions</H2>
      <P>
        If a payment fails or is left incomplete, any amount deducted by your bank or
        UPI app that doesn't reach us is typically auto-reversed by your bank/Razorpay
        within their standard timelines (usually 5–7 business days) — this isn't a
        refund from us, it's your bank completing a transaction that never succeeded on
        our end.
      </P>

      <H2>Front-desk / offline payments</H2>
      <P>
        Payments made directly at your gym (cash, card, or UPI at the front desk, not
        through this App) are governed by your gym's own refund/cancellation practices,
        not this policy.
      </P>

      <H2>Contact</H2>
      <P>
        Questions about a specific charge? Email{' '}
        <a href="mailto:info@f8os.in" className="underline">info@f8os.in</a> or call
        +91 82779 03670 (Mon–Sat, 9 AM–7 PM IST) with your payment reference.
      </P>
    </LegalPageShell>
  )
}
