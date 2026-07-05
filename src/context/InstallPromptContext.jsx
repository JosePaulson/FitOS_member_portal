import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const DISMISS_KEY = 'fitos_install_dismissed_at'
const DISMISS_COOLDOWN_DAYS = 7

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS Safari
  )
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function wasDismissedRecently() {
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const dismissedAt = Number(raw)
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
  return daysSince < DISMISS_COOLDOWN_DAYS
}

const Ctx = createContext(null)

/**
 * Manages the "Add to Home Screen" install prompt for the member portal PWA.
 *
 * IMPORTANT: this lives in a single Provider mounted once at the app root
 * (see main.jsx). The browser fires `beforeinstallprompt` at most once per
 * page load — if every component that wanted this state called its own
 * separate `useState`/`useEffect` copy (as a plain hook would), only
 * whichever component instance happened to be mounted at that exact moment
 * would ever see it, and everyone else (e.g. the Profile page, mounted
 * later after login) would never get a chance to show the install option.
 * A single shared Provider guarantees there's exactly one listener for the
 * whole app lifetime, and every consumer reads the same captured event.
 *
 * Two related-but-different flags are exposed on purpose:
 *   - `canInstall`  — the browser has a real install prompt ready to fire.
 *                      This drives persistent, opt-in UI (the manual
 *                      "Install app" row in Profile) and should stay true
 *                      even if the passive banner was dismissed.
 *   - `showBanner`  — canInstall AND not dismissed in the last 7 days.
 *                      This drives the floating, unprompted banner only.
 * Before this split, dismissing the banner once also hid the Profile page's
 * manual install option for a week, which looked indistinguishable from
 * "there's no install option at all".
 */
export function InstallPromptProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall]         = useState(false)
  const [dismissed, setDismissed]           = useState(wasDismissedRecently())
  const [installed, setInstalled]           = useState(isStandalone())
  const [showIOSBanner, setShowIOSBanner]   = useState(
    isIOSDevice() && !isStandalone() && !wasDismissedRecently()
  )

  useEffect(() => {
    if (isStandalone()) return

    function handleBeforeInstall(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      // Capability is independent of any earlier banner dismissal —
      // only the passive banner (showBanner, below) respects the cooldown.
      setCanInstall(true)
    }

    function handleInstalled() {
      setInstalled(true)
      setCanInstall(false)
      setShowIOSBanner(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return { outcome: 'unavailable' }
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setCanInstall(false)
    if (choice.outcome === 'dismissed') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
      setDismissed(true)
    }
    return choice
  }, [deferredPrompt])

  // Dismisses only the passive banner — the manual Profile option stays put.
  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
    setShowIOSBanner(false)
  }, [])

  const value = {
    canInstall,                          // true whenever the browser can install — drives Profile's persistent row
    showBanner: canInstall && !dismissed, // true only for the floating banner
    showIOSBanner,                       // iOS manual-instructions banner (also respects dismissal)
    installed,                           // true if already running standalone
    isIOS: isIOSDevice() && !installed,  // device is iOS Safari (no native prompt exists there)
    promptInstall,
    dismiss,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/**
 * Consumer hook — same name/shape as the old per-component hook so existing
 * call sites (`const { canInstall, ... } = useInstallPrompt()`) don't need
 * to change, only their import path does.
 */
export function useInstallPrompt() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useInstallPrompt must be used inside <InstallPromptProvider>')
  return ctx
}
