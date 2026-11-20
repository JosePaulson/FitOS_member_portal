import { useEffect, useRef } from 'react'

/**
 * Draw-your-signature box (finger, stylus or mouse). Reports a PNG data URL
 * via onChange, or null when cleared/empty. Always white so the signature
 * stays legible on the printed PDF whatever the app theme.
 */
export default function SignaturePad({ onChange, height = 150 }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const dirty = useRef(false)

  // Match the bitmap to the on-screen size (and pixel ratio) so lines aren't blurry.
  useEffect(() => {
    const c = canvasRef.current
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    c.width = c.offsetWidth * ratio
    c.height = height * ratio
    const ctx = c.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
  }, [height])

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  function down(e) {
    e.preventDefault()
    canvasRef.current.setPointerCapture?.(e.pointerId)
    drawing.current = true
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = pos(e)
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.01, y + 0.01); ctx.stroke()
  }
  function move(e) {
    if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = pos(e)
    ctx.lineTo(x, y); ctx.stroke()
    dirty.current = true
  }
  function up() {
    if (!drawing.current) return
    drawing.current = false
    if (dirty.current) onChange?.(canvasRef.current.toDataURL('image/png'))
  }
  function clear() {
    const c = canvasRef.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    dirty.current = false
    onChange?.(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
        style={{ width: '100%', height, background: '#fff', borderRadius: 12, border: '1px solid var(--color-border)', touchAction: 'none', display: 'block' }}
      />
      <div className="flex justify-between mt-1.5 text-[11px]" style={{ color: 'var(--color-secondary)' }}>
        <span>Sign above with your finger</span>
        <button type="button" onClick={clear}>Clear</button>
      </div>
    </div>
  )
}
