import { useLocation, useNavigate } from 'react-router-dom'
import { useInstallPrompt } from '../context/InstallPromptContext'

/**
 * Floating "workout videos" shortcut, bottom-right above the tab bar — home page only.
 * Opens Workouts straight on the Videos tab (tab index 3).
 */
export default function VideosFab() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { showBanner, showIOSBanner } = useInstallPrompt()

  if (pathname !== '/') return null
  const bannerUp = showBanner || showIOSBanner

  return (
    // Fixed wrapper is clamped to the same max-w-md column as the app so the
    // button hugs the app's right edge on wide screens, not the browser's.
    <div className="fixed left-1/2 z-30 flex justify-end w-full max-w-md px-4 -translate-x-1/2 pointer-events-none"
      style={{ bottom: `calc(${bannerUp ? 232 : 84}px + env(safe-area-inset-bottom, 0px))` }}>
      <button
        type="button"
        aria-label="Open workout videos"
        title="Workout videos"
        onClick={() => navigate('/workouts', { state: { tab: 3 } })}
        className="flex items-center justify-center transition-transform rounded-full pointer-events-auto active:scale-95"
        style={{
          width: 56, height: 56,
          background: 'var(--color-surface)',
          // Mild outlined shadow: a thin accent ring + a soft drop shadow.
          boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-accent) 35%, transparent), 0 4px 14px rgba(0, 0, 0, 0.35)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <PlayRingIcon size={38} />
      </button>
    </div>
  )
}

/** Circled play button: broken outer ring, soft inner disc, rounded outlined triangle — FitOS accent colour. */
function PlayRingIcon({ size = 38 }) {
  const c = 'var(--color-accent)'
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="17.5" fill={c} fillOpacity="0.1" />
      <circle cx="24" cy="24" r="20" stroke={c} strokeWidth="3" strokeLinecap="round"
        pathLength="100" strokeDasharray="44 6 44 6" strokeDashoffset="-3" transform="rotate(-100 24 24)" />
      <path d="M19.5 16.5 L32 24 L19.5 31.5 Z" stroke={c} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}
