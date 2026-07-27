import { Routes, Route, Navigate } from 'react-router-dom'
import { useMemberAuth } from './context/MemberAuthContext'
import Layout       from './components/layout/Layout'
import PrivateRoute from './components/PrivateRoute'
import Spinner      from './components/ui/Spinner'
import UpdateChecker from './components/UpdateChecker'
import CookieConsentBanner from './components/CookieConsentBanner'
import Login    from './pages/Login'
import Home     from './pages/Home'
import Plans    from './pages/Plans'
import Billing  from './pages/Billing'
import Workouts from './pages/Workouts'
import Profile  from './pages/Profile'
import BMI      from './pages/BMI'
import Chat     from './pages/Chat'
import Equipment from './pages/Equipment'
import Support from './pages/Support'
import LegalHub       from './pages/legal/LegalHub'
import TermsOfService from './pages/legal/TermsOfService'
import PrivacyPolicy  from './pages/legal/PrivacyPolicy'
import RefundPolicy   from './pages/legal/RefundPolicy'
import CookiePolicy   from './pages/legal/CookiePolicy'

export default function App() {
  const { loading } = useMemberAuth()

  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
          <Spinner />
        </div>
        <UpdateChecker />
        <CookieConsentBanner />
      </>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* ── Legal pages — public, work whether signed in or not ── */}
        <Route path="/legal" element={<LegalHub />} />
        <Route path="/legal/terms" element={<TermsOfService />} />
        <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/legal/refund-policy" element={<RefundPolicy />} />
        <Route path="/legal/cookie-policy" element={<CookiePolicy />} />

        <Route
          path="/"
          element={<PrivateRoute><Layout /></PrivateRoute>}
        >
          <Route index              element={<Home />}     />
          <Route path="plans"       element={<Plans />}    />
          <Route path="billing"     element={<Billing />}  />
          <Route path="workouts"    element={<Workouts />} />
          <Route path="profile"     element={<Profile />}  />
          <Route path="bmi"         element={<BMI />}      />
          <Route path="chat"        element={<Chat />}     />
          <Route path="equipment"   element={<Equipment />} />
          <Route path="support"     element={<Support />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UpdateChecker />
      <CookieConsentBanner />
    </>
  )
}
