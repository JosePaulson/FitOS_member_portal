import { useState } from 'react'

const BMI_CATEGORIES = [
  { max: 18.5, label: 'Underweight', color: '#60a5fa', tip: 'Consider a calorie surplus and strength training to build muscle mass.' },
  { max: 25.0, label: 'Normal weight', color: '#C8F135', tip: 'Great work! Focus on maintaining your weight with balanced nutrition and regular exercise.' },
  { max: 30.0, label: 'Overweight', color: '#fbbf24', tip: 'A moderate calorie deficit combined with cardio and strength training will help.' },
  { max: 35.0, label: 'Obese (Class I)', color: '#fb923c', tip: 'Consult your trainer and consider a structured programme with dietary changes.' },
  { max: 40.0, label: 'Obese (Class II)', color: '#f87171', tip: 'Medical guidance alongside your fitness programme is recommended.' },
  { max: Infinity, label: 'Obese (Class III)', color: '#ef4444', tip: 'Please consult a healthcare provider before starting any exercise programme.' },
]

function getCategory(bmi) { return BMI_CATEGORIES.find((c) => bmi < c.max) || BMI_CATEGORIES.at(-1) }
function calcBMI(w, h) { const hm = h / 100; return w / (hm * hm) }
function idealRange(h) { const hm = h / 100; return { min: (18.5 * hm * hm).toFixed(1), max: (24.9 * hm * hm).toFixed(1) } }

/**
 * Devine formula (1974) — the long-standing clinical reference for ideal
 * body weight, still the most widely used in medicine today. Genuinely
 * gender-specific: the base weight for the first 5 feet of height differs
 * because it derives from population weight-for-height data collected
 * separately by sex, not just a flat offset.
 */
function idealBodyWeight(heightCm, gender) {
  const inchesOver5ft = Math.max(0, heightCm / 2.54 - 60)
  const base = gender === 'female' ? 45.5 : 50
  return +(base + 2.3 * inchesOver5ft).toFixed(1)
}

/**
 * Deurenberg formula (1991) — BMI alone can't tell fat from muscle, which
 * is the single biggest source of BMI's well-known inaccuracy (it can
 * misclassify muscular people as "overweight"). This estimates body fat %
 * from BMI, age, and sex — sex matters a lot here since women carry
 * meaningfully more essential fat than men at the same BMI/age.
 */
function bodyFatPercent(bmi, age, gender) {
  const sex = gender === 'female' ? 0 : 1
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * sex - 5.4
  return +Math.max(2, bf).toFixed(1) // floor at a physiologically plausible minimum
}

/**
 * ACE (American Council on Exercise) body fat % categories — thresholds
 * are meaningfully different by gender due to essential fat differences,
 * not just shifted BMI bands.
 */
function bodyFatCategory(bf, gender) {
  const table = gender === 'female'
    ? [{ max: 13, label: 'Essential fat' }, { max: 20, label: 'Athletic' }, { max: 24, label: 'Fitness' }, { max: 31, label: 'Average' }, { max: Infinity, label: 'Above average' }]
    : [{ max: 5, label: 'Essential fat' }, { max: 13, label: 'Athletic' }, { max: 17, label: 'Fitness' }, { max: 24, label: 'Average' }, { max: Infinity, label: 'Above average' }]
  return table.find((c) => bf < c.max)?.label || table.at(-1).label
}

const HISTORY_KEY = 'fitos_bmi_history'
function loadHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] } }
function saveHistory(h) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 10))) }

export default function BMI() {
  const [unit, setUnit] = useState('metric')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [lbs, setLbs] = useState('')
  const [feet, setFeet] = useState('')
  const [inches, setInches] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('male')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState(loadHistory)

  function calculate() {
    let w, h
    if (unit === 'metric') { w = parseFloat(weight); h = parseFloat(height) }
    else { w = parseFloat(lbs) * 0.453592; h = (parseFloat(feet) * 12 + parseFloat(inches || 0)) * 2.54 }
    if (!w || !h || w <= 0 || h <= 0) return

    const bmi = calcBMI(w, h)
    const cat = getCategory(bmi)
    const ideal = idealRange(h)
    const a = parseFloat(age) || 25
    const bmr = gender === 'male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161
    const ibw = idealBodyWeight(h, gender)
    const bodyFat = bodyFatPercent(bmi, a, gender)
    const bodyFatCat = bodyFatCategory(bodyFat, gender)

    const r = {
      bmi: +bmi.toFixed(1), category: cat.label, color: cat.color, tip: cat.tip,
      ideal, idealBodyWeight: ibw, bodyFat, bodyFatCat, gender,
      bmr: Math.round(bmr), weight: w.toFixed(1), height: h.toFixed(1),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    }
    setResult(r)
    const nh = [r, ...history.filter((_, i) => i < 9)]
    setHistory(nh); saveHistory(nh)
  }

  const needlePct = result ? Math.min(100, Math.max(0, ((result.bmi - 10) / 35) * 100)) : null

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>BMI Calculator</h1>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-secondary)' }}>Body Mass Index — a health screening tool</p>
      </div>

      {/* Unit toggle */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        {['metric', 'imperial'].map((u) => (
          <button key={u} onClick={() => { setUnit(u); setResult(null) }}
            className="flex-1 py-2 text-xs font-semibold capitalize transition-all rounded-lg"
            style={{ background: unit === u ? 'var(--color-accent)' : 'transparent', color: unit === u ? '#0D0D0D' : 'var(--color-secondary)' }}>
            {u}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-4 p-5 card">
        {unit === 'metric' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (kg)"><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="field-input" placeholder="70" /></Field>
            <Field label="Height (cm)"><input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="field-input" placeholder="175" /></Field>
          </div>
        ) : (
          <>
            <Field label="Weight (lbs)"><input type="number" value={lbs} onChange={(e) => setLbs(e.target.value)} className="field-input" placeholder="154" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Feet"><input type="number" value={feet} onChange={(e) => setFeet(e.target.value)} className="field-input" placeholder="5" /></Field>
              <Field label="Inches"><input type="number" value={inches} onChange={(e) => setInches(e.target.value)} className="field-input" placeholder="9" /></Field>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Age (optional)"><input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="field-input" placeholder="28" /></Field>
          <Field label="Gender (used for BMR, ideal weight & body fat %)">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}>
              {['male', 'female'].map((g) => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className="flex-1 py-2 text-xs font-medium capitalize transition-all rounded"
                  style={{ background: gender === g ? 'rgba(200,241,53,0.2)' : 'transparent', color: gender === g ? 'var(--color-accent)' : 'var(--color-secondary)' }}>
                  {g}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <button onClick={calculate}
          className="w-full py-3 text-sm font-bold transition-all rounded-xl"
          style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
          Calculate BMI
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-5 p-6 card">
          <div className="text-center">
            <p className="mb-1 text-xs tracking-widest uppercase" style={{ color: 'var(--color-secondary)' }}>Your BMI</p>
            <p className="text-6xl font-black tracking-tighter" style={{ color: result.color }}>{result.bmi}</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: result.color }}>{result.category}</p>
          </div>

          {/* Gauge */}
          <div>
            <div className="flex h-3 overflow-hidden rounded-full">
              {[
                { flex: 1, bg: '#60a5fa40' },
                { flex: 2.6, bg: '#C8F13540' },
                { flex: 2, bg: '#fbbf2440' },
                { flex: 2, bg: '#fb923c40' },
                { flex: 2, bg: '#f8717140' },
                { flex: 2, bg: '#ef444440' },
              ].map((s, i) => <div key={i} style={{ flex: s.flex, background: s.bg }} />)}
            </div>
            <div className="relative h-3 -mt-3 pointer-events-none">
              <div className="absolute w-1 h-5 transition-all -translate-x-1/2 rounded-full -top-1"
                style={{ left: `${needlePct}%`, background: result.color }} />
            </div>
            <div className="flex justify-between text-[10px] mt-2" style={{ color: 'var(--color-secondary)' }}>
              {['10', '18.5', '25', '30', '35', '40+'].map((v) => <span key={v}>{v}</span>)}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            {[
              { label: 'Ideal weight range (BMI-based)', value: `${result.ideal.min}–${result.ideal.max} kg` },
              { label: `Ideal body weight (${result.gender})`, value: `${result.idealBodyWeight} kg` },
              { label: 'Your weight', value: `${result.weight} kg` },
              { label: 'Your height', value: `${result.height} cm` },
              ...(result.bmr > 0 ? [{ label: 'Basal metabolic rate', value: `${result.bmr} kcal/day` }] : []),
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px]" style={{ color: 'var(--color-secondary)' }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Body fat estimate — gender-adjusted, since BMI alone can't tell fat from muscle */}
          {result.bodyFat != null && (
            <div className="pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>Estimated body fat</p>
                <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                  {result.bodyFat}% <span className="text-xs font-normal" style={{ color: 'var(--color-secondary)' }}>· {result.bodyFatCat}</span>
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--color-surface-3)' }}>
                <div className="h-2 transition-all rounded-full" style={{ width: `${Math.min(100, result.bodyFat * 2)}%`, background: 'var(--color-accent)' }} />
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--color-hint)' }}>
                Estimated from BMI, age, and sex (Deurenberg formula) — not a substitute for a skinfold, DEXA, or bioimpedance measurement.
              </p>
            </div>
          )}

          {/* Tip */}
          <div className="px-4 py-3 text-xs leading-relaxed rounded-xl"
            style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-secondary)' }}>
            💡 {result.tip}
          </div>
          <p className="text-[10px] text-center" style={{ color: 'var(--color-hint)' }}>
            BMI is a screening tool, not a diagnostic measure. Consult a professional for personalised advice.
          </p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>History</h2>
            <button onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY) }}
              className="text-xs transition-colors" style={{ color: 'var(--color-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}>
              Clear
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-4 card">
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>{h.date}</p>
                  <p className="text-xs font-semibold" style={{ color: h.color }}>{h.category}</p>
                </div>
                <span className="text-2xl font-black" style={{ color: h.color }}>{h.bmi}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}