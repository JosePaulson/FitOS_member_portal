import { useRef, useState } from 'react'
import { portalApi } from '../api/index'
import Spinner, { Badge } from './ui/Spinner'

const CONFIDENCE_COLOR = { high: 'lime', medium: 'yellow', low: 'red' }
const CONFIDENCE_LABEL = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }

/**
 * "Scan Meal" flow — lets a member either take a photo with their camera or
 * upload one from their gallery, sends it to the AI vision endpoint, and
 * shows the estimated calories/macros. Always surfaces the AI-approximation
 * disclaimer alongside any result.
 */
export default function FoodScannerModal({ onClose, onSaved }) {
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { scan, disclaimer }

  function pickFile(selected) {
    if (!selected) return
    setError('')
    setResult(null)
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  function reset() {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError('')
  }

  async function analyze() {
    if (!file) return
    setAnalyzing(true)
    setError('')
    try {
      const { data } = await portalApi.scanMeal(file)
      setResult(data)
      onSaved?.(data.scan)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not analyze this photo — try again with a clearer shot')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto relative animate-fade-up"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose}
          className="absolute text-2xl leading-none top-4 right-5"
          style={{ color: 'var(--color-secondary)' }}>×</button>

        <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--color-primary)' }}>📷 Scan Meal</h2>
        <p className="mb-4 text-xs" style={{ color: 'var(--color-secondary)' }}>
          Snap or upload a photo of your meal and AI will estimate the calories and macros.
        </p>

        {/* Hidden inputs — one forces the camera, one opens the gallery */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />

        {/* Step 1: pick a source */}
        {!previewUrl && (
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-2 py-6 rounded-xl transition-all"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <span className="text-2xl">📸</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>Take Photo</span>
            </button>
            <button onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center gap-2 py-6 rounded-xl transition-all"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <span className="text-2xl">🖼️</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>Upload from Gallery</span>
            </button>
          </div>
        )}

        {/* Step 2: preview + analyze */}
        {previewUrl && !result && (
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-xl aspect-video" style={{ background: 'var(--color-surface-3)' }}>
              <img src={previewUrl} alt="Selected meal" className="object-cover w-full h-full" />
            </div>

            {error && (
              <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>
            )}

            {analyzing ? (
              <div className="flex flex-col items-center gap-2 py-3">
                <Spinner />
                <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>Analyzing your meal…</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={reset}
                  className="flex-1 py-3 text-sm font-semibold transition-all rounded-xl"
                  style={{ background: 'var(--color-surface-3)', color: 'var(--color-primary)' }}>
                  Choose another
                </button>
                <button onClick={analyze}
                  className="flex-1 py-3 text-sm font-bold transition-all rounded-xl"
                  style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
                  Analyze meal
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: results */}
        {result && (
          <div className="flex flex-col gap-4 animate-fade-up">
            <div className="overflow-hidden rounded-xl aspect-video" style={{ background: 'var(--color-surface-3)' }}>
              <img src={previewUrl} alt="Scanned meal" className="object-cover w-full h-full" />
            </div>

            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                {result.scan.mealLabel || 'Scanned meal'}
              </h3>
              <Badge color={CONFIDENCE_COLOR[result.scan.confidence] || 'muted'}>
                {CONFIDENCE_LABEL[result.scan.confidence] || result.scan.confidence}
              </Badge>
            </div>

            {/* Big calorie number */}
            <div className="p-4 text-center card">
              <p className="text-4xl font-black" style={{ color: 'var(--color-accent)' }}>
                🔥 {result.scan.totalCalories}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>estimated kcal</p>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Protein', value: result.scan.totalProtein, icon: '🥩' },
                { label: 'Carbs', value: result.scan.totalCarbs, icon: '🍚' },
                { label: 'Fat', value: result.scan.totalFat, icon: '🥑' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="p-3 text-center card">
                  <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>{icon} {label}</p>
                  <p className="mt-1 font-bold" style={{ color: 'var(--color-primary)' }}>{value}g</p>
                </div>
              ))}
            </div>

            {/* Itemized breakdown */}
            {result.scan.items?.length > 0 && (
              <div className="p-4 card">
                <h4 className="mb-2 text-xs font-bold" style={{ color: 'var(--color-secondary)' }}>Detected items</h4>
                <div className="flex flex-col gap-1">
                  {result.scan.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 text-sm"
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                      <div>
                        <span style={{ color: 'var(--color-primary)' }}>{item.name}</span>
                        {item.quantity && <span className="ml-2 text-xs" style={{ color: 'var(--color-secondary)' }}>{item.quantity}</span>}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>{item.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.scan.notes && (
              <p className="text-xs italic" style={{ color: 'var(--color-secondary)' }}>{result.scan.notes}</p>
            )}

            {/* AI disclaimer — always shown with results */}
            <div className="px-4 py-3 text-xs rounded-xl"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
              ⚠️ {result.disclaimer || 'These values are calculated by AI and are only approximate — not a substitute for precise nutrition tracking.'}
            </div>

            <div className="flex gap-2">
              <button onClick={reset}
                className="flex-1 py-3 text-sm font-semibold transition-all rounded-xl"
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-primary)' }}>
                Scan another
              </button>
              <button onClick={onClose}
                className="flex-1 py-3 text-sm font-bold transition-all rounded-xl"
                style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
