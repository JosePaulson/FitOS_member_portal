import { Component } from 'react'
import { resetAppCachesAndReload } from '../lib/recovery'
import { IS_DEV } from '../lib/errors'

/**
 * Wraps <Routes> (see App.jsx) so a render crash on any one page shows a
 * friendly, recoverable screen instead of taking down the entire app to a
 * blank page. React unmounts the WHOLE tree on an uncaught render error by
 * default — without this boundary, a bug on a single page (or, just as
 * often, a stale/incompatible shape sitting in this device's localStorage
 * cache from a previous app version — see lib/offline.js) leaves the
 * member looking at nothing at all, with no way to recover except manually
 * clearing site data or reinstalling. Deliberately kept OUTSIDE this
 * boundary in App.jsx: UpdateChecker and CookieConsentBanner, so they keep
 * working even while this fallback is showing.
 *
 * The recovery action reuses the exact same "wipe every cache and reload"
 * flow as the update-available prompt, since a crash caused by stale
 * cached data and a crash caused by stale code are the same fix.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, resetting: false, error: null, componentStack: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // No error-tracking service wired up yet — at minimum this keeps the
    // failure visible in the console instead of vanishing silently.
    console.error('[ErrorBoundary] caught a render error:', error, info?.componentStack)
    this.setState({ componentStack: info?.componentStack || '' })
  }

  handleReload = async () => {
    this.setState({ resetting: true })
    await resetAppCachesAndReload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="fixed inset-0 z-[998] flex items-center justify-center px-6"
        style={{ background: 'var(--color-surface, #0D0D0D)' }}>
        <div className="w-full max-w-sm p-6 text-center rounded-2xl"
          style={{ background: 'var(--color-surface-2, #161616)', border: '1px solid var(--color-border, rgba(255,255,255,0.08))' }}>
          <div className="mb-3 text-4xl">😕</div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary, #f5f4ef)' }}>
            Something went wrong
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-secondary, #888880)' }}>
            This page hit an unexpected error. Reloading usually fixes it.
          </p>
          {IS_DEV && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="text-xs cursor-pointer" style={{ color: 'var(--color-secondary, #888880)' }}>Developer details (development only)</summary>
              <pre className="p-3 mt-2 overflow-auto text-[11px] leading-snug whitespace-pre-wrap rounded-lg" style={{ background: 'rgba(0,0,0,0.4)', color: '#fca5a5', maxHeight: 220 }}>
                {String(this.state.error?.stack || this.state.error?.message || this.state.error)}{this.state.componentStack}
              </pre>
            </details>
          )}
          <button onClick={this.handleReload} disabled={this.state.resetting}
            className="w-full font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60 mt-5"
            style={{ background: 'var(--color-accent, #c8f135)', color: '#0D0D0D' }}>
            {this.state.resetting ? 'Reloading…' : 'Reload app'}
          </button>
        </div>
      </div>
    )
  }
}
