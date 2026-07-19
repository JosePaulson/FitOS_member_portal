import { useEffect, useRef } from 'react'

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
 * How it works: opening the view pushes one history entry. Both a real
 * back-button press (popstate) and the in-app close button (which
 * triggers history.back()) converge on the same popstate handler, so
 * onClose() only ever fires once per open view.
 */
export function useBackableState(value, onClose) {
  const pushedRef = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (value && !pushedRef.current) {
      window.history.pushState({ __backable: true }, '')
      pushedRef.current = true
    }
    // Closed some other way (e.g. programmatically) — nothing to clean up;
    // the pushed entry is harmlessly consumed by the next real back press.
  }, [value])

  useEffect(() => {
    function handlePopState() {
      if (pushedRef.current) {
        pushedRef.current = false
        onCloseRef.current()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function goBack() {
    if (pushedRef.current) {
      window.history.back() // -> popstate -> handlePopState -> onClose()
    } else {
      onCloseRef.current()
    }
  }

  return goBack
}
