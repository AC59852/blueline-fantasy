import { ref, computed, watchEffect } from 'vue'

const BASE = import.meta.env.VITE_NHL_BASE ?? '/nhl'
const MUG_FALLBACK = 'https://assets.nhle.com/mugs/nhl/default-skater.png'

export function headshotUrl(row: any, season: string) {
  // traded players come back as "EDM,VGK" — last entry is the current club
  const team = String(row.teamAbbrevs).split(',').pop()!.trim()
  return `https://assets.nhle.com/mugs/nhl/${season}/${team}/${row.playerId}.png`
}

export function useSkaters() {
  const sort = ref('points')
  const dir = ref<'ASC' | 'DESC'>('DESC')
  const season = ref('20252026')
  const page = ref(0)
  const pageSize = ref(25)

  const rows = ref<any[]>([])
  const total = ref(0)
  const pending = ref(false)
  const error = ref<string | null>(null)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)
  const hasPrev = computed(() => page.value > 0)
  const hasNext = computed(() => page.value < totalPages.value - 1)

  watchEffect(async (onCleanup) => {
    const ctrl = new AbortController()
    onCleanup(() => ctrl.abort())

    pending.value = true
    error.value = null

    const params = new URLSearchParams({
      isAggregate: 'false',
      isGame: 'false',
      start: String(page.value * pageSize.value),
      limit: String(pageSize.value),
      sort: sort.value,
      dir: dir.value,
      factCayenneExp: 'gamesPlayed>=1',
      cayenneExp: `gameTypeId=2 and seasonId>=${season.value} and seasonId<=${season.value}`,
    })

    try {
      const res = await fetch(`${BASE}/skater/summary?${params}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      rows.value = json.data
      total.value = json.total
    } catch (e: any) {
      if (e.name !== 'AbortError') error.value = e.message
    } finally {
      pending.value = false
    }
  })

  function toggleSort(key: string) {
    if (sort.value === key) dir.value = dir.value === 'DESC' ? 'ASC' : 'DESC'
    else {
      sort.value = key
      dir.value = 'DESC'
    }
    page.value = 0 // re-sorting invalidates the current offset
  }

  const next = () => {
    if (hasNext.value) page.value++
  }
  const prev = () => {
    if (hasPrev.value) page.value--
  }

  return {
    rows,
    total,
    pending,
    error,
    sort,
    dir,
    season,
    page,
    pageSize,
    totalPages,
    hasPrev,
    hasNext,
    toggleSort,
    next,
    prev,
    MUG_FALLBACK,
  }
}
