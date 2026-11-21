import { useRef } from 'react'

/**
 * Date / date-time / month fields that always DISPLAY dd/mm/yyyy (India),
 * whatever the browser's locale is. The native picker is still used underneath
 * (an invisible <input> covers the field), so tapping opens the device's own
 * calendar and the value passed to onChange is the usual ISO string:
 *   <DateInput>      -> "YYYY-MM-DD"
 *   <DateTimeInput>  -> "YYYY-MM-DDTHH:mm"
 *   <MonthInput>     -> "YYYY-MM"
 * Props mirror a normal <input>: value, onChange(e) with e.target.value, min, max,
 * required, disabled, className, style, title.
 */

const pad = (n) => String(n).padStart(2, '0')

function display(kind, value) {
  if (!value) return ''
  if (kind === 'month') {
    const [y, m] = value.split('-')
    return y && m ? `${m}/${y}` : ''
  }
  const [datePart, timePart] = value.split('T')
  const [y, m, d] = (datePart || '').split('-')
  if (!y || !m || !d) return ''
  const date = `${d}/${m}/${y}`
  if (kind !== 'datetime-local' || !timePart) return date
  const [hh, mm] = timePart.split(':').map(Number)
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${date}, ${h12}:${pad(mm || 0)} ${hh >= 12 ? 'pm' : 'am'}`
}

const PLACEHOLDER = { date: 'dd/mm/yyyy', 'datetime-local': 'dd/mm/yyyy, --:-- --', month: 'mm/yyyy' }
const FOCUS = 'focus-within:border-[rgba(200,241,53,0.4)]'

function PickerInput({ kind, value, onChange, min, max, required, disabled, className = '', style, title, placeholder }) {
  const ref = useRef(null)
  const text = display(kind, value)

  function open() {
    if (disabled) return
    try { ref.current?.showPicker?.() } catch { /* some browsers only allow it on a direct tap */ }
  }

  return (
    <div
      title={title}
      className={`relative flex items-center justify-between gap-2 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className} ${FOCUS}`}
      style={style}
    >
      <span className={`truncate ${text ? '' : 'opacity-40'}`}>{text || placeholder || PLACEHOLDER[kind]}</span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 shrink-0" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <input
        ref={ref}
        type={kind}
        value={value || ''}
        onChange={onChange}
        onClick={open}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        aria-label={title || PLACEHOLDER[kind]}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
    </div>
  )
}

export function DateInput(props) { return <PickerInput kind="date" {...props} /> }
export function DateTimeInput(props) { return <PickerInput kind="datetime-local" {...props} /> }
export function MonthInput(props) { return <PickerInput kind="month" {...props} /> }
export default DateInput
