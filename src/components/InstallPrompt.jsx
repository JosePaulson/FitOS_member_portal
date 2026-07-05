import { useState } from 'react'
import { useInstallPrompt } from '../context/InstallPromptContext'
import IOSInstallSheet from './IOSInstallSheet'

/**
 * Global "Add to Home Screen" banner for the member portal PWA.
 *
 * - Android / Desktop: shows a banner with an "Install" button that
 *   triggers the native browser install dialog.
 * - iOS Safari: shows a banner that opens a bottom sheet with manual
 *   "tap Share → Add to Home Screen" steps (iOS has no install API).
 * - Hidden entirely once installed, or for 7 days after being dismissed.
 *
 * Layout is deliberately two rows (info row, then a full-width action
 * button) rather than everything crammed into one row — a single row with
 * an icon + title + subtitle + dismiss + install button has no room to
 * breathe on narrow phones (~320–360px wide) and either overflows or
 * squeezes the dismiss "×" into a tap target too small to hit reliably.
 * Stacking avoids that entirely regardless of screen width, and gives the
 * primary action a full-width, thumb-friendly button.
 */
export default function InstallPrompt({ withTabBar = true }) {
  const { canInstall, showBanner, showIOSBanner, promptInstall, dismiss } = useInstallPrompt()
  const [showIOSSheet, setShowIOSSheet] = useState(false)

  if (!showBanner && !showIOSBanner) return null

  return (
    <>
      {/* Banner */}
      <div
        className="fixed lg:left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md animate-fade-up px-0"
        style={{
          bottom: withTabBar
            ? 'calc(64px + env(safe-area-inset-bottom, 0px) + 10px)'
            : 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        }}
      >
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          {/* Info row */}
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 text-sm font-black rounded-xl shrink-0"
              style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}
            >
              F
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                Install FitOS
              </p>
              <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--color-secondary)' }}>
                Add to your home screen for quick, full-screen access
              </p>
            </div>

            {/* Dismiss — sized as a real touch target (36x36), not a bare character */}
            <button
              onClick={dismiss}
              className="flex items-center justify-center -mt-1 -mr-1 text-lg leading-none transition-colors rounded-full w-9 h-9 shrink-0"
              style={{ color: 'var(--color-secondary)' }}
              aria-label="Dismiss install prompt"
            >
              ×
            </button>
          </div>

          {/* Full-width action button — never squeezed, always easy to tap */}
          <button
            onClick={() => (canInstall ? promptInstall() : setShowIOSSheet(true))}
            className="w-full mt-3 text-sm font-bold py-2.5 rounded-xl transition-all"
            style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}
          >
            Install app
          </button>
        </div>
      </div>

      {showIOSSheet && <IOSInstallSheet onClose={() => setShowIOSSheet(false)} />}
    </>
  )
}
