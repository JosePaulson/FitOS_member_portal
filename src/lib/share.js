// Uses the native Web Share API where available — on a phone this opens
// the OS share sheet, which already lists WhatsApp, Instagram, Messages,
// etc. (whatever's installed). When the share includes an image, apps
// like Instagram and WhatsApp treat it as an actual photo to post/send
// rather than a plain text link, which is what makes sharing a workout
// feel worth doing. Falls back to downloading the image (or copying the
// text) on browsers/desktops without share-sheet support.
export async function shareContent({ title, text, imageBlob }) {
  const files = imageBlob ? [new File([imageBlob], 'fitos-workout.png', { type: 'image/png' })] : undefined

  if (navigator.share && (!files || (navigator.canShare && navigator.canShare({ files })))) {
    try {
      await navigator.share(files ? { title, text, files } : { title, text })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled' // the person closed the share sheet
      // fall through to a fallback for any other failure
    }
  }

  if (imageBlob) {
    // No share-sheet support for files — offer the image as a download
    // instead of silently losing it.
    const url = URL.createObjectURL(imageBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fitos-workout.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return 'downloaded'
  }

  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}

// Normalizes a workout log or PT session into the shape both the text
// summary and the image card are built from, so the two stay in sync.
function toShareData(subject, { kind }) {
  const rows = (subject.exercises || []).slice(0, 8).map((ex) => {
    const bits = []
    if (ex.weight != null) bits.push(`${ex.weight}kg`)
    if (ex.sets) bits.push(`${ex.sets} sets`)
    if (ex.reps) bits.push(`× ${ex.reps}`)
    return { name: ex.name, detail: bits.join(' · ') }
  })
  const moreCount = Math.max(0, (subject.exercises?.length || 0) - 8)

  const stats = []
  if (subject.caloriesBurned) stats.push({ icon: '🔥', label: `${subject.caloriesBurned} kcal` })
  if (subject.durationMinutes) stats.push({ icon: '⏱️', label: `${subject.durationMinutes} min` })

  const subtitleBits = []
  if (kind === 'pt' && subject.trainerId?.name) subtitleBits.push(`with ${subject.trainerId.name}`)
  if (subject.date) subtitleBits.push(new Date(subject.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))

  return {
    title: subject.title || (kind === 'pt' ? 'PT Session' : 'Workout'),
    subtitle: subtitleBits.join(' · '),
    rows,
    moreCount,
    stats,
    footer: kind === 'pt' ? 'Trained with FitOS' : 'Logged with FitOS',
  }
}

export function buildWorkoutLogShareData(log) { return toShareData(log, { kind: 'workout' }) }
export function buildPTSessionShareData(session) { return toShareData(session, { kind: 'pt' }) }

// "🏋️ Leg Day\n• Barbell Squat — 100kg · 5 sets\n...\n🔥 420 kcal · ⏱️ 52 min\nLogged with FitOS 💪"
export function shareDataToText(data) {
  const lines = [`🏋️ ${data.title}`]
  if (data.subtitle) lines.push(data.subtitle)
  lines.push(...data.rows.map((r) => `• ${r.name}${r.detail ? ` — ${r.detail}` : ''}`))
  if (data.moreCount) lines.push(`…and ${data.moreCount} more`)
  if (data.stats.length) lines.push(data.stats.map((s) => `${s.icon} ${s.label}`).join(' · '))
  lines.push(`${data.footer} 💪`)
  return lines.join('\n')
}

const CARD_W = 1080
const CARD_H = 1350
const ACCENT = '#c8f135'
const BG = '#0d0d0d'
const CARD_BG = '#161616'
const BORDER = 'rgba(255,255,255,0.08)'

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Draws a branded, Instagram/WhatsApp-friendly summary card (1080×1350)
 * for a workout log or PT session and resolves to a PNG Blob.
 */
export function generateShareImage(data) {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')

  // Background + soft lime glow, top-left
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  const glow = ctx.createRadialGradient(160, 120, 0, 160, 120, 520)
  glow.addColorStop(0, 'rgba(200,241,53,0.16)')
  glow.addColorStop(1, 'rgba(200,241,53,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  let y = 96

  // Wordmark
  ctx.textBaseline = 'alphabetic'
  ctx.font = '700 40px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Fit', 72, y)
  const fitW = ctx.measureText('Fit').width
  ctx.fillStyle = ACCENT
  ctx.fillText('OS', 72 + fitW, y)

  y += 90

  // Title (wraps up to 2 lines)
  ctx.font = '800 64px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#ffffff'
  const titleLines = wrapText(ctx, data.title, CARD_W - 144).slice(0, 2)
  titleLines.forEach((line) => { ctx.fillText(line, 72, y); y += 74 })

  if (data.subtitle) {
    y += 4
    ctx.font = '500 30px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillText(data.subtitle, 72, y)
    y += 40
  }

  y += 30

  // Exercise list card
  const cardX = 72
  const cardW = CARD_W - 144
  const rowH = 76
  const listPad = 40
  const visibleRows = data.rows.slice(0, 7)
  const cardH = listPad * 2 + visibleRows.length * rowH + (data.moreCount ? 50 : 0)

  ctx.fillStyle = CARD_BG
  roundRect(ctx, cardX, y, cardW, cardH, 28)
  ctx.fill()
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 2
  roundRect(ctx, cardX, y, cardW, cardH, 28)
  ctx.stroke()

  let rowY = y + listPad + 8
  visibleRows.forEach((row, i) => {
    if (i > 0) {
      ctx.strokeStyle = BORDER
      ctx.beginPath()
      ctx.moveTo(cardX + listPad, rowY - rowH + 34)
      ctx.lineTo(cardX + cardW - listPad, rowY - rowH + 34)
      ctx.stroke()
    }
    ctx.font = '600 32px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#ffffff'
    const name = truncateToWidth(ctx, row.name, cardW - listPad * 2)
    ctx.fillText(name, cardX + listPad, rowY)
    if (row.detail) {
      ctx.font = '600 28px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = ACCENT
      const detailW = ctx.measureText(row.detail).width
      ctx.fillText(row.detail, cardX + cardW - listPad - detailW, rowY)
    }
    rowY += rowH
  })
  if (data.moreCount) {
    ctx.font = '500 26px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillText(`…and ${data.moreCount} more`, cardX + listPad, rowY - 20)
  }

  y += cardH + 44

  // Stat pills (calories / duration)
  if (data.stats.length) {
    let pillX = cardX
    data.stats.forEach((s) => {
      ctx.font = '700 30px system-ui, -apple-system, sans-serif'
      const label = `${s.icon} ${s.label}`
      const textW = ctx.measureText(label).width
      const pillW = textW + 56
      ctx.fillStyle = 'rgba(200,241,53,0.12)'
      roundRect(ctx, pillX, y, pillW, 64, 32)
      ctx.fill()
      ctx.fillStyle = ACCENT
      ctx.fillText(label, pillX + 28, y + 42)
      pillX += pillW + 16
    })
  }

  // Footer, bottom-anchored
  ctx.font = '600 28px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  const footerText = `${data.footer} 💪`
  const footerW = ctx.measureText(footerText).width
  ctx.fillText(footerText, (CARD_W - footerW) / 2, CARD_H - 64)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let truncated = text
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return `${truncated}…`
}
