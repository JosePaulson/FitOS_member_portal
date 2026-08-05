import { useEffect, useRef, useState } from 'react'

/**
 * Touch + mouse drag-to-reorder for a vertical list, built on the Pointer
 * Events API so the exact same code works for mouse AND touch — native
 * HTML5 drag-and-drop (the `draggable` attribute) isn't reliably
 * supported on mobile browsers, which matters since this dashboard is
 * used from tablets/phones too.
 *
 * Usage:
 *   const { list, dragIndex, getHandleProps, setRowRef } = useDragReorder(items, onReorderCommitted)
 *   // render `list` (not the original `items`) while composing rows
 *   // spread getHandleProps(index) onto a small drag-handle element
 *   // attach ref={setRowRef(index)} to each row's wrapping element
 *
 * `onReorder(newOrderedItems)` fires once, when the drag ends — not on
 * every intermediate swap — so callers can safely persist it (e.g. one
 * API call) without debouncing.
 *
 * move/up tracking lives on `window`, not on the handle element itself.
 * Rows are rendered with an index-based key, so mid-drag reordering
 * causes React to reuse/reassign existing DOM nodes to whichever item
 * now sits at that position — the specific node the drag started on can
 * end up representing a different list item after the first swap. Pointer
 * capture set on that original node doesn't follow the item being
 * dragged, so listening on window instead sidesteps the whole issue.
 */
export function useDragReorder(items, onReorder) {
  const [list, setList] = useState(items)
  const [dragIndex, setDragIndex] = useState(null)
  const rowRefs = useRef([])
  const listRef = useRef(list)
  listRef.current = list
  const dragIndexRef = useRef(null)
  dragIndexRef.current = dragIndex
  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder

  // Stay in sync with the caller's data whenever we're not mid-drag.
  useEffect(() => {
    if (dragIndex === null) setList(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, dragIndex === null])

  function setRowRef(index) {
    return (el) => { rowRefs.current[index] = el }
  }

  function computeTargetIndex(y) {
    const rects = rowRefs.current.map((el) => el?.getBoundingClientRect())
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i]
      if (!r) continue
      if (y < r.top + r.height / 2) return i
    }
    return rects.length - 1
  }

  // Active only while a drag is in progress. Attaching to window (rather
  // than the handle element + pointer capture) means it keeps working no
  // matter what React does with the underlying DOM nodes as the list
  // reorders mid-drag. Keyed off "is a drag active" rather than the exact
  // index, so the listeners are set up once at drag start and torn down
  // once at drag end — not re-subscribed every time the pointer crosses a
  // row boundary (dragIndexRef/listRef stay current regardless).
  useEffect(() => {
    if (dragIndex === null) return

    function handleMove(e) {
      if (e.cancelable) e.preventDefault()
      const target = computeTargetIndex(e.clientY)
      if (target >= 0 && target !== dragIndexRef.current) {
        setList((prev) => {
          const next = [...prev]
          const [moved] = next.splice(dragIndexRef.current, 1)
          next.splice(target, 0, moved)
          return next
        })
        setDragIndex(target)
      }
    }
    function handleUp() {
      onReorderRef.current(listRef.current)
      setDragIndex(null)
    }

    window.addEventListener('pointermove', handleMove, { passive: false })
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragIndex === null])

  function getHandleProps(index) {
    return {
      onPointerDown: (e) => {
        e.preventDefault()
        setDragIndex(index)
      },
      style: { touchAction: 'none', cursor: dragIndex === null ? 'grab' : 'grabbing' },
    }
  }

  return { list, dragIndex, getHandleProps, setRowRef }
}
