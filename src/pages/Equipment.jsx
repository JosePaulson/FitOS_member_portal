import { useEffect, useState } from 'react'
import { portalApi } from '../api/index'
import Spinner, { EmptyState } from '../components/ui/Spinner'

const CATEGORY_LABEL = {
  cardio:        'Cardio',
  strength:      'Strength',
  'free-weights':'Free weights',
  machines:      'Machines',
  accessories:   'Accessories',
  other:         'Other',
}

const CATEGORIES = ['cardio', 'strength', 'free-weights', 'machines', 'accessories', 'other']

export default function Equipment() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    portalApi.equipment()
      .then(({ data }) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter ? items.filter((i) => i.category === filter) : items
  const availableCategories = CATEGORIES.filter((c) => items.some((i) => i.category === c))

  if (selected) return <EquipmentDetail item={selected} onBack={() => setSelected(null)} />

  return (
    <div className="px-5 py-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>Gym Equipment</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>What's available at your gym</p>
      </div>

      {availableCategories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setFilter('')}
            className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0"
            style={{
              background: filter === '' ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color:      filter === '' ? '#0D0D0D' : 'var(--color-secondary)',
              border:     '1px solid var(--color-border)',
            }}
          >
            All
          </button>
          {availableCategories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0"
              style={{
                background: filter === c ? 'var(--color-accent)' : 'var(--color-surface-2)',
                color:      filter === c ? '#0D0D0D' : 'var(--color-secondary)',
                border:     '1px solid var(--color-border)',
              }}
            >
              {CATEGORY_LABEL[c] || c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🏋️" title="No equipment listed yet" sub="Check back later — your gym hasn't added any equipment details." />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item) => (
            <button
              key={item._id}
              onClick={() => setSelected(item)}
              className="card overflow-hidden text-left transition-all"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(200,241,53,0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <div className="aspect-square flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-surface-3)' }}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  : <span className="text-2xl opacity-30">🏋️</span>
                }
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-primary)' }}>{item.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                  {CATEGORY_LABEL[item.category] || item.category}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EquipmentDetail({ item, onBack }) {
  return (
    <div className="px-5 py-6 flex flex-col gap-5 animate-fade-up">
      <button onClick={onBack} className="flex items-center gap-2 text-sm transition-colors self-start"
        style={{ color: 'var(--color-secondary)' }}>
        ← Back to equipment
      </button>

      <div className="rounded-2xl overflow-hidden aspect-video flex items-center justify-center" style={{ background: 'var(--color-surface-3)' }}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          : <span className="text-4xl opacity-30">🏋️</span>
        }
      </div>

      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{item.name}</h2>
        <span
          className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-2"
          style={{ background: 'var(--color-surface-3)', color: 'var(--color-secondary)' }}
        >
          {CATEGORY_LABEL[item.category] || item.category}
        </span>
      </div>

      {item.description && (
        <div className="card p-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-primary)' }}>{item.description}</p>
        </div>
      )}
    </div>
  )
}
