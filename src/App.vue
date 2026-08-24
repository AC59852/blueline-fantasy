<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SkaterTable from '@/components/SkaterTable.vue'

interface Pick {
  round: number
  pick: number
  overall: number
  player: null | { playerId: number; skaterFullName: string; teamAbbrevs: string }
}

interface Round {
  round: number
  picks: Pick[]
}

const rounds = 16
const picksPerRound = 12

const draftArray = ref<Round[]>([])

onMounted(() => {
  draftArray.value = Array.from({ length: rounds }, (_, r) => ({
    round: r + 1,
    picks: Array.from({ length: picksPerRound }, (_, p) => ({
      round: r + 1,
      pick: p + 1,
      overall: r * picksPerRound + p + 1,
      player: null,
    })),
  }))
})
</script>

<template>
  <main class="main">
    <SkaterTable />

    <section class="draft">
      <div v-for="round in draftArray" :key="round.round" class="round">
        <h3>Round {{ round.round }}</h3>
        <ol class="picks">
          <li v-for="pick in round.picks" :key="pick.overall" :class="{ empty: !pick.player }">
            <span class="overall">{{ pick.overall }}</span>
            <span class="name">{{ pick.player?.skaterFullName ?? '—' }}</span>
          </li>
        </ol>
      </div>
    </section>
  </main>
</template>

<style scoped>
.main {
  display: flex;
}

.draft {
  display: flex;
  flex-wrap: wrap;
  gap: 0 2rem;
  width: 50%;
  align-content: flex-start;
}
</style>
