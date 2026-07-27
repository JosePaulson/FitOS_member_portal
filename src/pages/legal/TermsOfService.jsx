import LegalPageShell, { H2, P, Ul } from '../../components/legal/LegalPageShell'

export default function TermsOfService() {
  return (
    <LegalPageShell title="Terms & Conditions" updated="26 July 2026">
      <P>
        These Terms & Conditions ("Terms") govern your use of the FitOS Member Portal
        (the "App"), operated by Kerasoft India ("FitOS", "we", "us"). The App is made
        available to you by the gym you are a member of ("your gym"), which uses FitOS
        as its member-management software. By logging in and using the App, you agree
        to these Terms.
      </P>

      <H2>1. Your account</H2>
      <P>
        Member accounts are created and managed by your gym's staff, not by
        self-registration. You sign in with a Gym ID, your phone number, and a PIN set
        by your gym. You're responsible for keeping your PIN confidential and for all
        activity under your account. If you suspect unauthorized access, tell your gym
        immediately so they can reset your PIN.
      </P>

      <H2>2. What the App is for</H2>
      <P>The App lets you, depending on what your gym has enabled:</P>
      <Ul>
        <li>Log workouts, view PT sessions, and track exercise history and personal records.</li>
        <li>Book or view personal training sessions with your gym's trainers.</li>
        <li>Track body weight, BMI, and progress photos/graphs over time.</li>
        <li>Use the AI Coach chat feature and the AI food scanner for nutrition estimates.</li>
        <li>View gym equipment, workout demo videos, and your assigned membership/PT/workout plans.</li>
        <li>Check in for attendance, raise complaints/feedback, and manage your plan/PT session payments.</li>
      </Ul>

      <H2>3. Health & fitness disclaimer</H2>
      <P>
        FitOS is a software platform, not a medical, dietary, or fitness advice
        provider. Content in the App — including AI Coach responses, food-scan nutrition
        estimates, BMI calculations, and workout demo videos — is for general
        informational purposes only and is not a substitute for professional medical,
        nutritional, or fitness advice. Always consult a qualified physician before
        starting any exercise or diet program, particularly if you have a pre-existing
        condition. You use equipment, exercises, and facilities at your gym entirely at
        your own risk and subject to your gym's own house rules and waivers.
      </P>

      <H2>4. AI features</H2>
      <P>
        AI Coach and the food scanner use third-party AI models (such as those from
        OpenAI, Anthropic, or Google, depending on what your gym has configured) to
        generate responses and estimates. These are automated and may be inaccurate or
        incomplete — don't rely on them for medical, allergy, or safety-critical
        decisions. Don't submit sensitive personal information, or content about
        someone else without their consent, into the chat or food scanner.
      </P>

      <H2>5. Payments</H2>
      <P>
        If your gym has online payments enabled, you may be able to pay for membership
        plans or PT sessions directly in the App via our payment processor (Razorpay).
        All such payments are subject to our{' '}
        <a href="/legal/refund-policy" className="underline">Refund Policy</a>. Payments
        made at your gym's front desk are governed by your gym's own billing practices.
      </P>

      <H2>6. Acceptable use</H2>
      <P>You agree not to:</P>
      <Ul>
        <li>Use the App for any unlawful purpose or to harass, abuse, or impersonate anyone.</li>
        <li>Attempt to access another member's account or data, or bypass authentication.</li>
        <li>Interfere with, reverse-engineer, or disrupt the App's normal operation.</li>
        <li>Upload content (including food-scan photos) that is unlawful, obscene, or infringes someone else's rights.</li>
      </Ul>

      <H2>7. Your gym's relationship to FitOS</H2>
      <P>
        Your gym is an independent business that uses FitOS software. FitOS is not
        responsible for your gym's facilities, staff, trainers, equipment, membership
        pricing, class schedules, or in-person conduct — those are your gym's
        responsibility. Disputes about your membership itself (as opposed to the App)
        should be raised with your gym directly, or through the App's complaints
        feature where your gym has enabled it.
      </P>

      <H2>8. Availability & changes</H2>
      <P>
        We aim to keep the App available and reliable but don't guarantee uninterrupted
        access — features may change, and the App may be temporarily unavailable for
        maintenance or due to factors outside our control. We may update these Terms
        from time to time; continued use of the App after an update means you accept
        the revised Terms.
      </P>

      <H2>9. Limitation of liability</H2>
      <P>
        To the fullest extent permitted by law, FitOS and Kerasoft India are not liable
        for indirect, incidental, or consequential damages arising from your use of the
        App, or for the accuracy of AI-generated content, or for the acts/omissions of
        your gym. Nothing in these Terms limits liability that cannot be limited under
        Indian law.
      </P>

      <H2>10. Termination</H2>
      <P>
        Your gym may suspend or end your App access if your membership ends or as part
        of their own policies. We may also suspend accounts that violate these Terms.
      </P>

      <H2>11. Governing law</H2>
      <P>
        These Terms are governed by the laws of India, and any disputes will be subject
        to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.
      </P>

      <H2>12. Contact</H2>
      <P>
        Questions about these Terms? Reach us at{' '}
        <a href="mailto:info@f8os.in" className="underline">info@f8os.in</a> or
        +91 82779 03670 (Mon–Sat, 9 AM–7 PM IST).
      </P>
    </LegalPageShell>
  )
}
