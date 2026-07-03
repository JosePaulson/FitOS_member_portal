import { useState, useEffect } from 'react'
import { useMemberAuth } from '../context/MemberAuthContext'

const BMI_CATEGORIES = [
  { max: 18.5, label: 'Underweight',      color: 'text-blue-400',   bg: 'bg-blue-400',   tip: 'Consider a calorie surplus and strength training to build muscle mass.' },
  { max: 25.0, label: 'Normal weight',    color: 'text-lime',        bg: 'bg-lime',       tip: 'Great work! Focus on maintaining your weight with balanced nutrition and regular exercise.' },
  { max: 30.0, label: 'Overweight',       color: 'text-yellow-400', bg: 'bg-yellow-400', tip: 'A moderate calorie deficit combined with cardio and strength training will help.' },
  { max: 35.0, label: 'Obese (Class I)',  color: 'text-orange-400', bg: 'bg-orange-400', tip: 'Consult your trainer and consider a structured programme with dietary changes.' },
  { max: 40.0, label: 'Obese (Class II)', color: 'text-red-400',    bg: 'bg-red-400',    tip: 'Medical guidance alongside your fitness programme is recommended.' },
  { max: Infinity, label: 'Obese (Class III)', color: 'text-red-500', bg: 'bg-red-500',  tip: 'Please consult a healthcare provider before starting any exercise programme.' },
]

function getCategory(bmi) {
  return BMI_CATEGORIES.find((c) => bmi < c.max) || BMI_CATEGORIES[BMI_CATEGORIES.length - 1]
}

function calcBMI(weight, height) {
  const hm = height / 100
  return weight / (hm * hm)
}

function idealWeightRange(height) {
  const hm = height / 100
  return {
    min: (18.5 * hm * hm).toFixed(1),
    max: (24.9 * hm * hm).toFixed(1),
  }
}

const HISTORY_KEY = 'fitos_bmi_history'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(h) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 10)))
}

export default function BMI() {
  const { member } = useMemberAuth()

  const [unit,    setUnit]    = useState('metric')   // 'metric' | 'imperial'
  // Metric
  const [weight,  setWeight]  = useState('')   // kg
  const [height,  setHeight]  = useState('')   // cm
  // Imperial
  const [lbs,     setLbs]     = useState('')
  const [feet,    setFeet]    = useState('')
  const [inches,  setInches]  = useState('')

  const [age,     setAge]     = useState('')
  const [gender,  setGender]  = useState('male')
  const [result,  setResult]  = useState(null)
  const [history, setHistory] = useState(loadHistory)

  // Pre-fill name if available
  useEffect(() => {
    // nothing to prefill from member for height/weight — no server data
  }, [member])

  function calculate() {
    let w, h

    if (unit === 'metric') {
      w = parseFloat(weight)
      h = parseFloat(height)
    } else {
      w = parseFloat(lbs) * 0.453592
      h = (parseFloat(feet) * 12 + parseFloat(inches || 0)) * 2.54
    }

    if (!w || !h || w <= 0 || h <= 0) return

    const bmi     = calcBMI(w, h)
    const cat     = getCategory(bmi)
    const ideal   = idealWeightRange(h)

    // BMR (Mifflin-St Jeor)
    const a       = parseFloat(age) || 25
    const bmr     = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161

    const newResult = {
      bmi:      +bmi.toFixed(1),
      category: cat.label,
      color:    cat.color,
      bg:       cat.bg,
      tip:      cat.tip,
      ideal,
      bmr:      Math.round(bmr),
      weight:   w.toFixed(1),
      height:   h.toFixed(1),
      date:     new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    }

    setResult(newResult)

    const newHistory = [newResult, ...history.filter((_, i) => i < 9)]
    setHistory(newHistory)
    saveHistory(newHistory)
  }

  function clearHistory() {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  // BMI needle position (BMI 10–45 range mapped to 0–100%)
  const needlePct = result
    ? Math.min(100, Math.max(0, ((result.bmi - 10) / 35) * 100))
    : null

  return (
    <div className="px-5 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">BMI Calculator</h1>
        <p className="text-muted text-xs mt-1">Body Mass Index — a simple health screening tool</p>
      </div>

      {/* Unit toggle */}
      <div className="flex gap-1 bg-card border border-white/[0.08] rounded-xl p-1">
        {['metric', 'imperial'].map((u) => (
          <button key={u} onClick={() => { setUnit(u); setResult(null) }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
              unit === u ? 'bg-lime text-black' : 'text-muted hover:text-cream'
            }`}>
            {u}
          </button>
        ))}
      </div>

      {/* Input form */}
      <div className="card p-5 flex flex-col gap-4">
        {unit === 'metric' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (kg)">
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                className="field-input" placeholder="70" min="1" max="300" />
            </Field>
            <Field label="Height (cm)">
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                className="field-input" placeholder="175" min="50" max="250" />
            </Field>
          </div>
        ) : (
          <>
            <Field label="Weight (lbs)">
              <input type="number" value={lbs} onChange={(e) => setLbs(e.target.value)}
                className="field-input" placeholder="154" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Height (ft)">
                <input type="number" value={feet} onChange={(e) => setFeet(e.target.value)}
                  className="field-input" placeholder="5" />
              </Field>
              <Field label="Inches">
                <input type="number" value={inches} onChange={(e) => setInches(e.target.value)}
                  className="field-input" placeholder="9" />
              </Field>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Age (optional)">
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
              className="field-input" placeholder="28" min="10" max="100" />
          </Field>
          <Field label="Gender (optional)">
            <div className="flex gap-1 bg-white/[0.04] border border-white/10 rounded-lg p-1">
              {['male','female'].map((g) => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className={`flex-1 py-2 rounded text-xs font-medium capitalize transition-all ${
                    gender === g ? 'bg-lime/20 text-lime' : 'text-muted hover:text-cream'
                  }`}>{g}</button>
              ))}
            </div>
          </Field>
        </div>

        <button onClick={calculate}
          className="w-full bg-lime text-black font-bold py-3 rounded-xl text-sm hover:bg-lime-dark transition-all">
          Calculate BMI
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="card p-6 flex flex-col gap-5">
          {/* BMI number */}
          <div className="text-center">
            <p className="text-xs text-muted uppercase tracking-widest mb-1">Your BMI</p>
            <p className={`text-6xl font-black tracking-tighter ${result.color}`}>{result.bmi}</p>
            <p className={`text-sm font-semibold mt-1 ${result.color}`}>{result.category}</p>
          </div>

          {/* Gauge bar */}
          <div>
            <div className="h-3 rounded-full overflow-hidden flex">
              <div className="flex-1 bg-blue-400/40" />
              <div className="flex-[2.6] bg-lime/40" />
              <div className="flex-[2] bg-yellow-400/40" />
              <div className="flex-[2] bg-orange-400/40" />
              <div className="flex-[2] bg-red-400/40" />
              <div className="flex-[2] bg-red-600/40" />
            </div>
            {/* Needle */}
            <div className="relative h-3 -mt-3 pointer-events-none">
              <div className={`absolute w-1 h-5 -translate-x-1/2 -top-1 rounded-full ${result.bg}`}
                style={{ left: `${needlePct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted mt-2">
              <span>10</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40+</span>
            </div>
          </div>

          {/* Breakdown grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
            <InfoTile label="Ideal weight range" value={`${result.ideal.min}–${result.ideal.max} kg`} />
            <InfoTile label="Your weight" value={`${result.weight} kg`} />
            <InfoTile label="Your height" value={`${result.height} cm`} />
            {result.bmr > 0 && <InfoTile label="Basal metabolic rate" value={`${result.bmr} kcal/day`} />}
          </div>

          {/* Tip */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-muted leading-relaxed">
            💡 {result.tip}
          </div>

          <p className="text-[10px] text-muted/50 text-center">
            BMI is a screening tool, not a diagnostic measure. Consult a healthcare professional for personalised advice.
          </p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">History</h2>
            <button onClick={clearHistory} className="text-xs text-muted hover:text-red-400 transition-colors">
              Clear
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {history.map((h, i) => (
              <div key={i} className="card p-4 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted">{h.date}</span>
                  <span className={`text-xs font-semibold ${h.color}`}>{h.category}</span>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${h.color}`}>{h.bmi}</span>
                </div>
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
      <label className="text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}
