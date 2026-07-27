import LegalPageShell, { H2, P, Ul } from '../../components/legal/LegalPageShell'

export default function CookiePolicy() {
  return (
    <LegalPageShell title="Cookie Policy" updated="26 July 2026">
      <P>
        FitOS Member Portal is an installable web app (PWA). Instead of relying heavily
        on traditional third-party cookies, it mostly uses your browser's local
        storage, session storage, and service-worker cache — similar technologies that
        this policy covers together as "cookies" for simplicity.
      </P>

      <H2>What we use, and why</H2>
      <Ul>
        <li><strong>Strictly necessary</strong> — sign-in session tokens, so you stay logged in without re-entering your PIN every time. The App can't function without these.</li>
        <li><strong>Functional</strong> — your theme preference (light/dark), and offline caches of your workouts, PT sessions, and other data so the App loads quickly and still shows recent data with a poor connection.</li>
        <li><strong>App install & notifications</strong> — a small flag noting whether you've dismissed the "install app" prompt, and your push-notification subscription if you enable reminders.</li>
      </Ul>
      <P>
        We do <strong>not</strong> currently use third-party advertising or analytics
        cookies/trackers in the App. If that ever changes, we'll update this policy and
        ask for your consent via the in-app banner before any optional cookies are set.
      </P>

      <H2>Third-party content</H2>
      <P>
        Some content (like workout demo videos or food-scan images) is served from our
        media host, Cloudinary. Loading these may involve standard delivery-network
        requests, but we don't use them to track you across other sites.
      </P>

      <H2>Your choices</H2>
      <P>
        When you first open the App, you'll see a banner letting you choose "Essential
        only" or "Accept all." Since we don't use optional cookies today, both choices
        currently behave the same way — but your preference is saved so we can honor it
        automatically if optional cookies are introduced later. You can also clear all
        local storage at any time via your browser's site settings, or by uninstalling
        the app if you've installed it to your home screen — note that doing so will
        sign you out and clear any offline-cached data.
      </P>

      <H2>Changes to this policy</H2>
      <P>
        We may update this Cookie Policy from time to time; material changes will be
        reflected by an updated "Last updated" date above.
      </P>

      <H2>Contact</H2>
      <P>
        Questions? Email{' '}
        <a href="mailto:info@f8os.in" className="underline">info@f8os.in</a>.
      </P>
    </LegalPageShell>
  )
}
