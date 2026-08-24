<script setup lang="ts">
import { useSkaters, headshotUrl } from '@/composables/useSkaters'

const {
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
} = useSkaters()

const columns = [
  { key: 'skaterFullName', label: 'Player' },
  { key: 'teamAbbrevs', label: 'Team' },
  { key: 'positionCode', label: 'Pos' },
  { key: 'gamesPlayed', label: 'GP' },
  { key: 'goals', label: 'G' },
  { key: 'assists', label: 'A' },
  { key: 'points', label: 'P' },
  { key: 'plusMinus', label: '+/-' },
]

function onMugError(e: Event) {
  const img = e.target as HTMLImageElement
  if (img.src !== MUG_FALLBACK) img.src = MUG_FALLBACK
}
</script>

<template v-else>
  <section>
    <table :aria-busy="pending">
      <thead>
        <tr>
          <th>#</th>
          <th></th>
          <th v-for="c in columns" :key="c.key" role="button" @click="toggleSort(c.key)">
            {{ c.label }}
            <span v-if="sort === c.key">{{ dir === 'DESC' ? '▾' : '▴' }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="row.playerId">
          <td>{{ page * pageSize + i + 1 }}</td>
          <td>
            <img
              :src="headshotUrl(row, season)"
              :alt="row.skaterFullName"
              width="36"
              height="36"
              loading="lazy"
              @error="onMugError"
            />
          </td>
          <td v-for="c in columns" :key="c.key">{{ row[c.key] }}</td>
        </tr>
      </tbody>
    </table>
    <nav>
      <button :disabled="!hasPrev || pending" @click="prev">Previous</button>
      <span>Page {{ page + 1 }} of {{ totalPages }} — {{ total }} skaters</span>
      <button :disabled="!hasNext || pending" @click="next">Next</button>
    </nav>
  </section>
</template>
