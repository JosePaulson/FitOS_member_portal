import { useEffect, useState } from 'react'
import { portalApi } from '../api/index'
import { readCache, writeCache } from '../lib/offline'
import { MUSCLE_GROUPS as STATIC_MUSCLE_GROUPS, EXERCISE_CATALOG as STATIC_EXERCISE_CATALOG } from '../data/exerciseCatalog'

const CACHE_KEY = 'exerciseCatalog'

// Strips the old static file's icons for a shape-compatible fallback —
// the gym's own catalog (fetched below) never carries icons.
const STATIC_FALLBACK = {
  muscleGroups: STATIC_MUSCLE_GROUPS.map(({ key, label }) => ({ key, label })),
  catalog: STATIC_EXERCISE_CATALOG,
}

/**
 * The gym's exercise catalog (categories + exercise names), fetched from
 * the server so gym admins can add/edit/remove exercises and categories.
 * Falls back to a cached copy, then to the original static list, if the
 * request fails (offline, brand-new install, etc.) so the "add exercise"
 * flow never comes up empty.
 */
export function useExerciseCatalog() {
  const [data, setData] = useState(() => readCache(CACHE_KEY) || STATIC_FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    portalApi.exerciseCatalog()
      .then(({ data: res }) => {
        if (cancelled) return
        const next = { muscleGroups: res.muscleGroups || [], catalog: res.catalog || {} }
        setData(next)
        writeCache(CACHE_KEY, next)
      })
      .catch(() => { /* keep showing cached/static fallback above */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { muscleGroups: data.muscleGroups, catalog: data.catalog, loading }
}
