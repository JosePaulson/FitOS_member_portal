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
 */
export function useDragReorder(items, onReorder) {
  const [list, setList] = useState(items)
  const [dragIndex, setDragIndex] = useState(null)
  const rowRefs = useRef([])
  const listRef = useRef(list)
  listRef.current = list
  const dragIndexRef = useRef(null)
  dragIndexRef.current = dragIndex

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

  function handlePointerMove(e) {
    if (dragIndexRef.current === null) return
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

  function handlePointerUp(e) {
    if (dragIndexRef.current === null) return
    try { e.currentTarget.releasePointerCapture?.(e.pointerId) } catch { /* ignore */ }
    onReorder(listRef.current)
    setDragIndex(null)
  }

  function getHandleProps(index) {
    return {
      onPointerDown: (e) => {
        e.preventDefault()
        try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* ignore */ }
        setDragIndex(index)
      },
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      style: { touchAction: 'none', cursor: dragIndex === null ? 'grab' : 'grabbing' },
    }
  }

  return { list, dragIndex, getHandleProps, setRowRef }
}
