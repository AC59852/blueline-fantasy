import { ref, computed, watch, watchEffect } from 'vue'

const BASE = import.meta.env.VITE_NHL_BASE ?? '/nhl'
export const MUG_FALLBACK = 'https://assets.nhle.com/mugs/nhl/default-skater.png'

export function headshotUrl(row: any, season: string) {
  const team = String(row.teamAbbrevs).split(',').pop()!.trim()
  return `https://assets.nhle.com/mugs/nhl/${season}/${team}/${row.playerId}.png`
}

export type Position = 'ALL' | 'C' | 'W' | 'D' | 'G'

const POSITION_EXP: Record<Position, string | null> = {
  ALL: null,
  C: 'positionCode="C"',
  W: '(positionCode="L" or positionCode="R")',
  D: 'positionCode="D"',
  G: null, // goalies use a different endpoint entirely
}

// which report owns each sortable column
const REALTIME_KEYS = new Set(['hits', 'blockedShots', 'takeaways', 'giveaways'])

export const COLUMNS: Record<Position, { key: string; label: string }[]> = {
  ALL: [
    { key: 'skaterFullName', label: 'Player' }, { key: 'teamAbbrevs', label: 'Team' },
    { key: 'positionCode', label: 'Pos' }, { key: 'gamesPlayed', label: 'GP' },
    { key: 'goals', label: 'G' }, { key: 'assists', label: 'A' },
    { key: 'points', label: 'P' }, { key: 'plusMinus', label: '+/-' },
    { key: 'shots', label: 'S' }, { key: 'ppPoints', label: 'PPP' },
  ],
  C: [], W: [], // filled below
  D: [
    { key: 'skaterFullName', label: 'Player' }, { key: 'teamAbbrevs', label: 'Team' },
    { key: 'gamesPlayed', label: 'GP' }, { key: 'goals', label: 'G' },
    { key: 'assists', label: 'A' }, { key: 'points', label: 'P' },
    { key: 'plusMinus', label: '+/-' }, { key: 'blockedShots', label: 'BLK' },
    { key: 'hits', label: 'HIT' }, { key: 'ppPoints', label: 'PPP' },
  ],
  G: [
    { key: 'goalieFullName', label: 'Goalie' }, { key: 'teamAbbrevs', label: 'Team' },
    { key: 'gamesPlayed', label: 'GP' }, { key: 'wins', label: 'W' },
    { key: 'losses', label: 'L' }, { key: 'otLosses', label: 'OTL' },
    { key: 'goalsAgainstAverage', label: 'GAA' }, { key: 'savePctg', label: 'SV%' },
    { key: 'shutouts', label: 'SO' },
  ],
}
COLUMNS.C = COLUMNS.ALL
COLUMNS.W = COLUMNS.ALL

const fullCache = new Map<string, Map<number, any>>()

export function usePlayers() {
  const season = ref('20252026')
  const position = ref<Position>('ALL')
  const searchInput = ref('')
  const search = ref('')
  const sort = ref('points')
  const dir = ref<'ASC' | 'DESC'>('DESC')
  const page = ref(0)
  const pageSize = ref(25)

  const rows = ref<any[]>([])
  const total = ref(0)
  const pending = ref(false)
  const error = ref<string | null>(null)

  const isGoalie = computed(() => position.value === 'G')
  const columns = computed(() => COLUMNS[position.value])
  const nameKey = computed(() => (isGoalie.value ? 'goalieFullName' : 'skaterFullName'))
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)
  const hasPrev = computed(() => page.value > 0)
  const hasNext = computed(() => page.value < totalPages.value - 1)

  // debounce the search box
  let t: ReturnType<typeof setTimeout>
  watch(searchInput, (v) => {
    clearTimeout(t)
    t = setTimeout(() => { search.value = v.trim() }, 300)
  })

  // any of these invalidate the current offset
  watch([position, search, season], () => { page.value = 0 })

  watch(position, (p) => {
    sort.value = p === 'G' ? 'wins' : 'points'
    dir.value = 'DESC'
  })

  function buildExp(pos: Position, s: string, seasonId: string) {
    const parts = [
      `gameTypeId=2`,
      `seasonId>=${seasonId}`,
      `seasonId<=${seasonId}`,
    ]
    const posExp = POSITION_EXP[pos]
    if (posExp) parts.push(posExp)
    if (s) {
      const name = pos === 'G' ? 'goalieFullName' : 'skaterFullName'
      parts.push(`(${name} likeIgnoreCase "%${s}%" or teamAbbrevs likeIgnoreCase "%${s}%")`)
    }
    return parts.join(' and ')
  }

  async function fetchReport(
    path: string, exp: string, opts: Record<string, string>, signal: AbortSignal
  ) {
    const params = new URLSearchParams({
      isAggregate: 'false', isGame: 'false',
      factCayenneExp: 'gamesPlayed>=1', cayenneExp: exp, ...opts,
    })
    const res = await fetch(`${BASE}/${path}?${params}`, { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<{ data: any[]; total: number }>
  }

  // one full-league pull per report+season, cached, used only to merge D columns
  async function fullMap(path: string, seasonId: string, signal: AbortSignal) {
    const key = `${path}|${seasonId}`
    if (fullCache.has(key)) return fullCache.get(key)!
    const exp = `gameTypeId=2 and seasonId>=${seasonId} and seasonId<=${seasonId}`
    const json = await fetchReport(path, exp, { limit: '-1', start: '0' }, signal)
    const map = new Map<number, any>(json.data.map((r) => [r.playerId, r]))
    fullCache.set(key, map)
    return map
  }

  watchEffect(async (onCleanup) => {
    const ctrl = new AbortController()
    onCleanup(() => ctrl.abort())

    pending.value = true
    error.value = null

    const pos = position.value
    const exp = buildExp(pos, search.value, season.value)
    const paging = {
      start: String(page.value * pageSize.value),
      limit: String(pageSize.value),
      sort: sort.value,
      dir: dir.value,
    }

    try {
      if (pos === 'G') {
        const json = await fetchReport('goalie/summary', exp, paging, ctrl.signal)
        rows.value = json.data
        total.value = json.total
        return
      }

      // for D, the sort key decides which report paginates; the other is merged in
      const sortsOnRealtime = REALTIME_KEYS.has(sort.value)
      const primary = sortsOnRealtime ? 'skater/realtime' : 'skater/summary'
      const json = await fetchReport(primary, exp, paging, ctrl.signal)

      if (pos === 'D') {
        const other = sortsOnRealtime ? 'skater/summary' : 'skater/realtime'
        const map = await fullMap(other, season.value, ctrl.signal)
        rows.value = json.data.map((r) => ({ ...(map.get(r.playerId) ?? {}), ...r }))
      } else {
        rows.value = json.data
      }
      total.value = json.total
    } catch (e: any) {
      if (e.name !== 'AbortError') error.value = e.message
    } finally {
      pending.value = false
    }
  })

  function toggleSort(key: string) {
    if (sort.value === key) dir.value = dir.value === 'DESC' ? 'ASC' : 'DESC'
    else { sort.value = key; dir.value = 'DESC' }
    page.value = 0
  }

  const next = () => { if (hasNext.value) page.value++ }
  const prev = () => { if (hasPrev.value) page.value-- }

  return {
    rows, total, pending, error, columns, nameKey, isGoalie,
    season, position, searchInput, sort, dir, page, pageSize,
    totalPages, hasPrev, hasNext, toggleSort, next, prev,
  }
}