import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

/**
 * App-wide replacement for the browser's alert / confirm / prompt.
 *
 *   await dialog.confirm({ title, message, confirmLabel, cancelLabel, tone })   → true | false
 *   await dialog.prompt({ title, message, label, placeholder, confirmLabel, tone, multiline, required, defaultValue }) → string | null (null = cancelled)
 *   dialog.error(message, { title })      — something failed
 *   dialog.success(message, { title })    — it worked
 *   dialog.info(message, { title })       — heads-up
 *   dialog.copy({ title, message, value }) — show a value with a Copy button (clipboard fallback)
 *
 * `tone: 'danger'` turns the confirm button red. Dialogs queue, so several
 * can be fired in a row. <DialogHost /> is mounted once in main.jsx.
 */

let queue = []
let seq = 0
const listeners = new Set()
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
const getSnapshot = () => queue
const emit = () => listeners.forEach((l) => l())

function push(spec) {
  return new Promise((resolve) => { queue = [...queue, { ...spec, id: ++seq, resolve }]; emit() })
}
function settle(id, value) {
  const d = queue.find((x) => x.id === id)
  queue = queue.filter((x) => x.id !== id)
  emit()
  d?.resolve(value)
}

export const dialog = {
  confirm: (o = {}) => push({ kind: 'confirm', title: 'Are you sure?', ...o }),
  prompt: (o = {}) => push({ kind: 'prompt', title: 'Enter a value', ...o }),
  error: (message, o = {}) => push({ kind: 'alert', tone: 'error', title: 'Something went wrong', message, ...o }),
  success: (message, o = {}) => push({ kind: 'alert', tone: 'success', title: 'Done', message, ...o }),
  info: (message, o = {}) => push({ kind: 'alert', tone: 'info', title: 'Heads up', message, ...o }),
  copy: (o = {}) => push({ kind: 'copy', title: 'Copy', ...o }),
}

// What each dialog resolves to when dismissed (Esc / backdrop / Cancel)
const dismissValue = (d) => (d.kind === 'confirm' ? false : d.kind === 'prompt' ? null : undefined)

export function DialogHost() {
  const items = useSyncExternalStore(subscribe, getSnapshot)
  const d = items[0]
  if (!d) return null
  return <DialogView key={d.id} d={d} done={(v) => settle(d.id, v)} />
}

const ICONS = {
  error:   { glyph: '✕', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  success: { glyph: '✓', color: 'var(--dlg-accent)', bg: 'var(--dlg-accent-bg)' },
  info:    { glyph: 'i', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  warning: { glyph: '!', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
}

function DialogView({ d, done }) {
  const [text, setText] = useState(d.defaultValue || '')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)
  const primaryRef = useRef(null)

  const danger = d.tone === 'danger'
  const iconKey = d.kind === 'alert' ? d.tone : d.kind === 'confirm' ? (danger ? 'warning' : 'info') : null
  const icon = iconKey ? ICONS[iconKey] || ICONS.info : null
  const canSubmit = d.kind !== 'prompt' || !d.required || text.trim() !== ''

  useEffect(() => {
    (d.kind === 'prompt' || d.kind === 'copy' ? inputRef : primaryRef).current?.focus()
    if (d.kind === 'copy') inputRef.current?.select()
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(dismissValue(d)) } }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function submit() {
    if (d.kind === 'confirm') return done(true)
    if (d.kind === 'prompt') { if (canSubmit) done(text.trim()); return }
    done(undefined)
  }

  async function copy() {
    try { await navigator.clipboard.writeText(d.value || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { inputRef.current?.select() }
  }

  return (
    <Overlay onBackdrop={() => done(dismissValue(d))}>
      <div role={d.kind === 'alert' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={`dlg-title-${d.id}`}>
        {icon && <IconBadge icon={icon} />}
        <h2 id={`dlg-title-${d.id}`} className="dlg-title">{d.title}</h2>
        {d.message && <p className="dlg-message">{d.message}</p>}

        {d.kind === 'prompt' && (
          <div className="dlg-field">
            {d.label && <label className="dlg-label">{d.label}</label>}
            {d.multiline ? (
              <textarea ref={inputRef} rows={3} value={text} maxLength={d.maxLength || 300} placeholder={d.placeholder}
                onChange={(e) => setText(e.target.value)} className="dlg-input" />
            ) : (
              <input ref={inputRef} type="text" value={text} maxLength={d.maxLength || 300} placeholder={d.placeholder}
                onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit() }} className="dlg-input" />
            )}
          </div>
        )}

        {d.kind === 'copy' && (
          <div className="dlg-field">
            <input ref={inputRef} type="text" readOnly value={d.value || ''} onFocus={(e) => e.target.select()} className="dlg-input" />
          </div>
        )}

        <div className="dlg-actions">
          {(d.kind === 'confirm' || d.kind === 'prompt') && (
            <button type="button" className="dlg-btn dlg-btn-ghost" onClick={() => done(dismissValue(d))}>{d.cancelLabel || 'Cancel'}</button>
          )}
          {d.kind === 'copy' && (
            <button type="button" className="dlg-btn dlg-btn-ghost" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
          )}
          <button ref={primaryRef} type="button" disabled={!canSubmit} onClick={submit}
            className={`dlg-btn ${danger ? 'dlg-btn-danger' : 'dlg-btn-primary'}`}>
            {d.kind === 'confirm' ? d.confirmLabel || 'Confirm'
              : d.kind === 'prompt' ? d.confirmLabel || 'Submit'
              : d.kind === 'copy' ? 'Done'
              : d.okLabel || 'OK'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

function Overlay({ children, onBackdrop }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-5" style={{ background: 'rgba(0,0,0,0.6)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onBackdrop() }}>
      <div className="w-full max-w-sm p-6 text-center rounded-2xl animate-fade-up dlg-root"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
        {children}
      </div>
      <style>{DLG_CSS}</style>
    </div>
  )
}

function IconBadge({ icon }) {
  return (
    <div className="flex items-center justify-center mx-auto mb-3 text-base font-bold rounded-full w-11 h-11" style={{ background: icon.bg, color: icon.color }}>
      {icon.glyph}
    </div>
  )
}

const DLG_CSS = `
.dlg-root { --dlg-accent: var(--color-accent); --dlg-accent-bg: rgba(200,241,53,0.14); }
.dlg-title { font-size: 1rem; font-weight: 700; color: var(--color-primary); }
.dlg-message { margin-top: .375rem; font-size: .8125rem; line-height: 1.45; color: var(--color-secondary); white-space: pre-line; }
.dlg-field { margin-top: 1rem; text-align: left; }
.dlg-label { display: block; margin-bottom: .375rem; font-size: .75rem; font-weight: 600; color: var(--color-secondary); }
.dlg-input { width: 100%; padding: .625rem .75rem; font-size: .875rem; color: var(--color-primary); background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: .5rem; outline: none; resize: none; }
.dlg-input:focus { border-color: var(--color-accent); }
.dlg-actions { display: flex; gap: .5rem; margin-top: 1.25rem; }
.dlg-btn { flex: 1; padding: .625rem .75rem; font-size: .8125rem; font-weight: 700; border-radius: .5rem; transition: all .15s; }
.dlg-btn:disabled { opacity: .5; }
.dlg-btn-primary { background: var(--color-accent); color: #0D0D0D; }
.dlg-btn-danger { background: #ef4444; color: #fff; }
.dlg-btn-ghost { color: var(--color-primary); background: var(--color-surface-2); border: 1px solid var(--color-border); }
`
