<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  usePlayers,
  headshotUrl,
  MUG_FALLBACK,
  type Position,
} from '@/composables/usePlayers'
import { useDraftStore } from '@/stores/draft'

const {
  rows,
  total,
  pending,
  error,
  columns,
  nameKey,
  isGoalie,
  season,
  position,
  searchInput,
  sort,
  dir,
  page,
  pageSize,
  totalPages,
  hasPrev,
  hasNext,
  toggleSort,
  next,
  prev,
} = usePlayers()

const store = useDraftStore()

const filters: { value: Position; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'C', label: 'C' },
  { value: 'W', label: 'W' },
  { value: 'D', label: 'D' },
  { value: 'G', label: 'G' },
]

const hideDrafted = ref(false)

const visibleRows = computed(() =>
  hideDrafted.value
    ? rows.value.filter((r) => !store.isDrafted(r.playerId))
    : rows.value
)

/** Total columns in the table, for empty-state colspan. */
const columnCount = computed(() => columns.value.length + 3)

function playerName(row: any): string {
  return row[nameKey.value] ?? row.skaterFullName ?? row.goalieFullName ?? '—'
}

/** teamAbbrevs is comma-joined for traded players; the last entry is current. */
function currentTeam(row: any): string {
  return String(row.teamAbbrevs ?? '').split(',').pop()!.trim()
}

function fmt(row: any, key: string) {
  const v = row[key]
  if (v == null || v === '') return '—'
  if (key === 'savePctg') return Number(v).toFixed(3).replace(/^0/, '')
  if (key === 'goalsAgainstAverage') return Number(v).toFixed(2)
  if (key === 'pointsPerGame') return Number(v).toFixed(2)
  if (key === 'timeOnIcePerGame') {
    const s = Number(v)
    return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
  }
  if (key === 'plusMinus' && Number(v) > 0) return `+${v}`
  return v
}

function add(row: any) {
  store.addToRound({
    playerId: row.playerId,
    name: playerName(row),
    team: currentTeam(row),
    position: row.positionCode ?? 'G',
    points: row.points,
    goals: row.goals,
    assists: row.assists,
  })
}

function onMugError(e: Event) {
  const img = e.target as HTMLImageElement
  if (img.src !== MUG_FALLBACK) img.src = MUG_FALLBACK
}
</script>

<template>
  <section class="skater-table">
    <div class="controls">
      <input
        v-model="searchInput"
        class="search"
        type="search"
        placeholder="Search players"
        aria-label="Search players"
      />

      <div class="filters" role="group" aria-label="Filter by position">
        <button
          v-for="f in filters"
          :key="f.value"
          type="button"
          class="filter"
          :class="{ active: position === f.value }"
          :aria-pressed="position === f.value"
          @click="position = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <button
        type="button"
        class="hide-drafted"
        :class="{ active: hideDrafted }"
        :aria-pressed="hideDrafted"
        @click="hideDrafted = !hideDrafted"
      >
        Hide drafted
      </button>
    </div>

    <p v-if="error" class="error" role="alert">
      Couldn't load stats — {{ error }}
      <button type="button" @click="page = page">Retry</button>
    </p>

    <template v-else>
      <table :aria-busy="pending">
        <thead>
          <tr>
            <th scope="col"><span class="sr-only">Add to round</span></th>
            <th scope="col"><span class="sr-only">Mark drafted</span></th>
            <th scope="col"><span class="sr-only">Headshot</span></th>
            <th
              v-for="c in columns"
              :key="c.key"
              scope="col"
              role="button"
              tabindex="0"
              :aria-sort="
                sort === c.key ? (dir === 'DESC' ? 'descending' : 'ascending') : 'none'
              "
              @click="toggleSort(c.key)"
              @keydown.enter.prevent="toggleSort(c.key)"
              @keydown.space.prevent="toggleSort(c.key)"
            >
              {{ c.label }}
              <span v-if="sort === c.key" aria-hidden="true">
                {{ dir === 'DESC' ? '▾' : '▴' }}
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="pending && !visibleRows.length">
            <td :colspan="columnCount">Loading players…</td>
          </tr>

          <tr v-else-if="!visibleRows.length">
            <td :colspan="columnCount">
              No players match those filters. Try clearing the search or switching position.
            </td>
          </tr>

          <tr
            v-for="row in visibleRows"
            :key="row.playerId"
            :class="{ drafted: store.isDrafted(row.playerId) }"
          >
            <td>
              <button
                type="button"
                class="add"
                :disabled="store.isRoundFull(store.selectedRound)"
                :title="
                  store.isRoundFull(store.selectedRound)
                    ? `Round ${store.selectedRound} is full`
                    : `Add ${playerName(row)} to round ${store.selectedRound}`
                "
                @click="add(row)"
              >
                Add
              </button>
            </td>

            <td>
              <button
                type="button"
                class="mark"
                :aria-pressed="store.isDrafted(row.playerId)"
                :aria-label="`Mark ${playerName(row)} as drafted`"
                @click="store.toggleDrafted(row.playerId)"
              >
                <span aria-hidden="true">{{ store.isDrafted(row.playerId) ? '●' : '○' }}</span>
              </button>
            </td>

            <td>
              <img
                class="mug"
                :src="headshotUrl(row, season)"
                :alt="playerName(row)"
                width="36"
                height="36"
                loading="lazy"
                @error="onMugError"
              />
            </td>

            <td v-for="c in columns" :key="c.key">
              <template v-if="c.key === nameKey">
                <span class="name">{{ playerName(row) }}</span>
                <span
                  v-for="r in store.roundsFor(row.playerId)"
                  :key="r"
                  class="badge"
                  :title="`Ranked in round ${r}`"
                >R{{ r }}</span>
              </template>
              <template v-else>
                {{ fmt(row, c.key) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>

      <nav class="pager" aria-label="Player pages">
        <button type="button" :disabled="!hasPrev || pending" @click="prev">
          Previous
        </button>
        <span>
          Page {{ page + 1 }} of {{ totalPages }} — {{ total }}
          {{ isGoalie ? 'goalies' : 'skaters' }}
        </span>
        <button type="button" :disabled="!hasNext || pending" @click="next">
          Next
        </button>
      </nav>
    </template>
  </section>
</template>

<style scoped>
/* Structural only — visual styling left to you. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>