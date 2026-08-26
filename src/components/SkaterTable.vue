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

const visibleRows = computed(() =>
  store.hideDrafted
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
        :class="{ active: store.hideDrafted }"
        :aria-pressed="store.hideDrafted"
        @click="store.toggleHideDrafted()"
      >
        Hide drafted
      </button>
    </div>

    <p v-if="error" class="error" role="alert">
      Couldn't load stats — {{ error }}
      <button type="button" @click="page = page">Retry</button>
    </p>

    <template v-else>
      <div class="table__wrapper">
        <table :aria-busy="pending" class="table">
          <colgroup>
            <col style="width: 3%" />   <!-- Add -->
            <col style="width: 1%" />   <!-- Drafted -->
            <col />                     <!-- Player — absorbs the slack -->
          <col v-for="c in columns.slice(1)" :key="c.key" style="width: 4%" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col"><span class="sr-only">Add to round</span></th>
            <th scope="col"><span class="sr-only">Mark drafted</span></th>
            <!-- <th scope="col"><span class="sr-only">Headshot</span></th> -->
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
              :class="`table__headings ${c.key === nameKey ? 'name name--heading' : ''}`"
            >
              {{ c.label }}
              <span v-if="sort === c.key" aria-hidden="true" class="table__arrow">
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
                :class="`mark ${store.isDrafted(row.playerId) ? 'active' : ''}`"
                :aria-pressed="store.isDrafted(row.playerId)"
                :aria-label="`Mark ${playerName(row)} as drafted`"
                @click="store.toggleDrafted(row.playerId)"
              >
                <span aria-hidden="true">{{ store.isDrafted(row.playerId) ? '●' : '○' }}</span>
              </button>
            </td>

            <!-- <td>
              <img
                class="mug"
                :src="headshotUrl(row, season)"
                :alt="playerName(row)"
                width="64"
                height="64"
                loading="lazy"
                @error="onMugError"
              />
            </td> -->

            <td v-for="c in columns" :key="c.key">
              <div :class="`cell-inner ${c.key === nameKey ? 'name' : ''}`"> <!-- Added wrapper -->
                <template v-if="c.key === nameKey">
                  <span class="name">{{ playerName(row) }}</span>
                  <div class="badges">
                    <span
                      v-for="r in store.roundsFor(row.playerId)"
                      :key="r"
                      class="badge"
                      :title="`Ranked in round ${r}`"
                    >R{{ r }}</span>
                  </div>
                </template>
                <template v-else>
                  {{ fmt(row, c.key) }}
                </template>
              </div> <!-- Close wrapper -->
            </td>
          </tr>
        </tbody>
      </table>
      </div>

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

.table__wrapper {
  max-height: calc(100vh - 18rem);
  overflow-y: scroll;
  margin-bottom: 2rem;
  padding: 0 0.6rem;
  box-sizing: border-box;
}

.table__headings {
  position: relative;
}

.table__arrow {
  position: absolute;
  bottom: -105%;
  left: 50%;
  transform: translateX(-50%);
}

td .cell-inner {
  margin: 0 0.6rem;
  text-align: center;
}

.name {
  text-align: left !important;
  display: inline-block;
}

.name--heading {
  margin-left: 0.6rem;
}

.controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  padding: 0.8rem;
  border-top: 1px solid rgb(29, 36, 44);
  border-bottom: 1px solid rgb(29, 36, 44);
  box-sizing: border-box;
  align-items: center;
  background-color: rgb(14, 18, 24);
}

.search {
  flex: 1 1 0%;
  border: 1px solid rgb(36, 46, 56);
  border-radius: 0.2rem;
  background-color: rgb(21, 27, 34);
  padding: 0.4rem 0.6rem;
  color: rgb(230, 237, 243);
}

.filters {
  display: flex;
  gap: 0.15rem;
}

.filter, .hide-drafted, .pager button {
  border: 1px solid rgb(36, 46, 56);
  border-radius: 0.2rem;
  background-color: transparent;
  padding: 0.4rem 0.6rem;
  color: rgb(110, 124, 140);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.filter.active, .hide-drafted.active, .pager button:enabled:hover {
  background-color: rgb(27, 36, 46);
  color: rgb(230, 237, 243);
  border: 1px solid rgb(62, 76, 90);
}

.pager button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pager {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

td {
  vertical-align: middle;
}

tr td {
  /* Mimics a bottom border without disrupting the separate border model */
  box-shadow: inset 0 -1px 0 0 #333; 
  padding-bottom: 0.8rem;
}

.add {
  background-color: rgba(144, 224, 137, 0.1);
  border: solid 1px rgb(144, 224, 137);
  color: rgb(144, 224, 137);
  text-transform: uppercase;
  font-size: 0.7rem;
  padding: 0.3rem 0.5rem;
  border-radius: 0.1rem;
  cursor: pointer;
}

/* add disabled */
.add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

tbody tr td:nth-child(1) {
  padding-right: 0.6rem;
}

.mark {
  background-color: transparent;
  border: none;
  color: rgb(110, 124, 140);
  font-size: 1.2rem;
  cursor: pointer;
  margin-top: -0.2rem;
}

.mark.active {
  color: rgb(144, 224, 137);
}

.cell-inner.name {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.badges {
  display: flex;
  gap: 0.3rem;
  align-items: center;
}

.badge {
  font-size: 0.7rem;
  background-color: rgba(127, 209, 232, 0.2);
  border: solid 1px rgb(127, 209, 232);
  color: rgb(230, 237, 243);
  padding: 0.2rem 0.4rem;
  border-radius: 0.2rem;
}
</style>