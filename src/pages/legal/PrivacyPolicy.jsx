import LegalPageShell, { H2, P, Ul } from '../../components/legal/LegalPageShell'

export default function PrivacyPolicy() {
  return (
    <LegalPageShell title="Privacy Policy" updated="26 July 2026">
      <P>
        This Privacy Policy explains what data the FitOS Member Portal collects, how
        it's used, and who it's shared with. FitOS is operated by Kerasoft India and
        provided to you on behalf of your gym, who is the primary controller of your
        membership data.
      </P>

      <H2>1. Information we collect</H2>
      <P>Depending on how your gym has configured the App, we process:</P>
      <Ul>
        <li><strong>Account details</strong> — name, phone number, and login PIN, set up by your gym.</li>
        <li><strong>Health & fitness data</strong> — weight, height, BMI history, workout logs, PT session records, and exercise personal records.</li>
        <li><strong>Food scan data</strong> — photos of meals you scan, and the nutrition estimates generated from them.</li>
        <li><strong>AI Coach conversations</strong> — messages you send to the in-app chat assistant.</li>
        <li><strong>Location data</strong> — a one-time GPS check at the moment you tap "check in", used only to confirm you're near your gym for attendance; we don't track your location continuously or in the background.</li>
        <li><strong>Payment data</strong> — if you pay for a plan/PT session in the App, our payment processor (Razorpay) handles your card/UPI details; we don't store your full payment credentials.</li>
        <li><strong>Device & usage data</strong> — basic technical data (browser type, push-notification tokens if you enable notifications) needed to operate the App and, where enabled, send you reminders.</li>
      </Ul>

      <H2>2. How we use your information</H2>
      <Ul>
        <li>To provide the App's core features — workout/PT tracking, attendance, plans, AI Coach, food scanning.</li>
        <li>To send you notifications you've opted into (e.g. session reminders, WhatsApp updates) via our messaging provider.</li>
        <li>To process payments you initiate in the App.</li>
        <li>To respond to support requests and complaints you raise.</li>
        <li>To maintain the security and reliability of the App.</li>
      </Ul>

      <H2>3. Who we share it with</H2>
      <P>We don't sell your data. We share it only as needed to run the App:</P>
      <Ul>
        <li><strong>Your gym</strong> — your workout, attendance, and plan data is visible to your gym's staff/trainers, since it's fundamentally their membership data.</li>
        <li><strong>AI providers</strong> — AI Coach messages and food-scan photos are sent to a third-party AI model (OpenAI, Anthropic, or Google, depending on your gym's configuration) to generate a response. These providers process the content to return a result; treat this like sending a message to any external service.</li>
        <li><strong>WATI</strong> — used to deliver WhatsApp notifications (e.g. reminders) to the phone number on your account.</li>
        <li><strong>Cloudinary</strong> — stores images you upload (e.g. food-scan photos) so they can be displayed back to you.</li>
        <li><strong>Razorpay</strong> — processes in-app payments; we receive confirmation of payment, not your full card/bank details.</li>
        <li><strong>Legal requirements</strong> — where we're required to disclose data to comply with law or protect rights and safety.</li>
      </Ul>

      <H2>4. Data retention</H2>
      <P>
        We retain your data for as long as your gym account is active, and for a
        reasonable period after in case you rejoin or as needed for legal/accounting
        purposes. Food-scan photos are replaced/purged as new scans are saved rather
        than kept indefinitely. You can ask your gym or us to delete your data sooner,
        subject to any records we're legally required to keep.
      </P>

      <H2>5. Your rights</H2>
      <P>
        You can ask to access, correct, or delete your personal data by contacting your
        gym (who manages your account) or us directly at{' '}
        <a href="mailto:info@f8os.in" className="underline">info@f8os.in</a>. Since your
        gym creates and controls your account, some requests (like PIN resets) are
        fastest handled by your gym's front desk.
      </P>

      <H2>6. Cookies & local storage</H2>
      <P>
        The App uses browser local storage for essential functions like keeping you
        signed in and caching data for offline use. See our{' '}
        <a href="/legal/cookie-policy" className="underline">Cookie Policy</a> for
        details.
      </P>

      <H2>7. Security</H2>
      <P>
        We use reasonable technical and organizational measures (encrypted connections,
        access controls, hashed PINs) to protect your data. No system is 100% secure,
        and we can't guarantee absolute security.
      </P>

      <H2>8. Children's privacy</H2>
      <P>
        The App is intended for gym members and is not directed at children. If your
        gym enrolls a member under 18, their account should be set up and supervised by
        a parent/guardian in coordination with the gym.
      </P>

      <H2>9. Changes to this policy</H2>
      <P>
        We may update this Privacy Policy from time to time. Material changes will be
        reflected by an updated "Last updated" date above.
      </P>

      <H2>10. Contact</H2>
      <P>
        Questions about this policy? Email{' '}
        <a href="mailto:info@f8os.in" className="underline">info@f8os.in</a> or call
        +91 82779 03670 (Mon–Sat, 9 AM–7 PM IST). Kerasoft India, Bengaluru, Karnataka,
        India.
      </P>
    </LegalPageShell>
  )
}
