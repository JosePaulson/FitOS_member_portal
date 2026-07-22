import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Makes a detail view (workout log, PT session, diet plan, etc.) respond to
 * the device/browser back button by closing itself instead of navigating
 * away from the app — the standard trick for making an SPA's modals/detail
 * views feel like real native screens instead of leaving a dead end where
 * "back" exits the whole app.
 *
 * Usage:
 *   const closeDetail = useBackableState(openItem, () => setOpenItem(null))
 *   // Use closeDetail() on the in-app "back"/"×" button instead of calling
 *   // setOpenItem(null) directly — this keeps browser history in sync so a
 *   // real back-button press and the in-app button behave identically.
 *
 * How it works: opening the view pushes ONE history entry — but through
 * React Router's own `navigate()`, not the raw `window.history` API. This
 * matters: React Router (v6's underlying history object) tracks its own
 * entry index in `window.history.state`, and a raw `pushState()` call
 * writes a plain object there instead, which desyncs that index from the
 * real browser stack. That desync is exactly what caused the earlier bug
 * where, after navigating in from a deep link (e.g. tapping a PT session on
 * the attendance calendar) and opening a detail view, a single back-button
 * press could skip past the list and land wherever the deep link itself
 * came from (e.g. the Profile page). Going through React Router end-to-end
 * keeps a single, consistent source of truth for the history stack, so a
 * back press always closes exactly one thing at a time.
 */
export function useBackableState(value, onClose) {
  const navigate = useNavigate()
  const location = useLocation()
  const pushedRef = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Opening the detail view pushes a marked history entry at the same URL.
  useEffect(() => {
    if (value && !pushedRef.current) {
      navigate(`${location.pathname}${location.search}${location.hash}`, {
        state: { __backable: true },
      })
      pushedRef.current = true
    }
    // Closed some other way (e.g. programmatically) — nothing to clean up;
    // the pushed entry is harmlessly consumed by the next real back press.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // A back/forward navigation landing anywhere that isn't our marked entry
  // means the "backable" entry was left — close the detail view. This
  // fires for a real back-button press, a swipe-back gesture, and our own
  // goBack() below (all of which are just POP navigations to React Router).
  useEffect(() => {
    if (pushedRef.current && !location.state?.__backable) {
      pushedRef.current = false
      onCloseRef.current()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  function goBack() {
    if (pushedRef.current) {
      navigate(-1) // -> POP -> the effect above -> onClose()
    } else {
      onCloseRef.current()
    }
  }

  return goBack
}
