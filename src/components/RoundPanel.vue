<script setup lang="ts">
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useDraftStore, type RankedPlayer } from '@/stores/draft'

const store = useDraftStore()

/** Writable proxy: Sortable hands back the reordered array, we persist it. */
const entries = computed<RankedPlayer[]>({
  get: () => store.currentEntries,
  set: (list) => store.setRoundOrder(store.selectedRound, list),
})

const emptyCount = computed(() => store.slotsPerRound - store.currentEntries.length)
</script>

<template>
  <aside class="panel">
    <nav class="tabs">
      <button
        v-for="r in store.roundNumbers"
        :key="r"
        type="button"
        :class="['panel__tab', { 'active': store.selectedRound === r }]"
        @click="store.selectedRound = r"
      >
        <span class="num">{{ r }}</span>
        <progress
          class="progress"
          :value="store.countFor(r)"
          :max="store.slotsPerRound"
        ></progress>
        <span class="count">{{ store.countFor(r) }}/{{ store.slotsPerRound }}</span>
      </button>
    </nav>

    <header class="head">
      <h2>Round {{ store.selectedRound }}</h2>
      <span>{{ store.currentEntries.length }} of {{ store.slotsPerRound }} ranked</span>
      <span class="hint">Drag to reorder</span>
    </header>

    <div class="slots">
      <VueDraggable
        v-model="entries"
        tag="ol"
        class="filled-list"
        :animation="150"
        handle=".handle"
        ghost-class="slot-ghost"
        chosen-class="slot-chosen"
        drag-class="slot-drag"
      >
        <li v-for="(p, i) in entries" :key="p.playerId" class="slot filled">
          <div class="body">
            <div class="line">
              <strong :title="`Drag to reorder ${p.name}`" class="handle">{{ p.name }}</strong>
              <span class="pos handle" :title="`Drag to reorder ${p.name}`">{{ p.position }}</span>
              <span class="team handle" :title="`Drag to reorder ${p.name}`">{{ p.team }}</span>
              <span v-if="p.points != null" class="stat handle" :title="`Drag to reorder ${p.name}`">
                {{ p.points }} PTS · {{ p.goals }}G {{ p.assists }}A
              </span>
            </div>
            <input
              class="note"
              :value="p.note ?? ''"
              placeholder="Add a note"
              @input="store.setNote(store.selectedRound, p.playerId, ($event.target as HTMLInputElement).value)"
            />
          </div>

          <button
            type="button"
            class="remove"
            :aria-label="`Remove ${p.name} from round ${store.selectedRound}`"
            @click="store.removeFromRound(store.selectedRound, p.playerId)"
          >×</button>
        </li>
      </VueDraggable>

      <ol class="empty-list" :start="store.currentEntries.length + 1">
        <li v-for="n in emptyCount" :key="`empty-${n}`" class="slot empty">
          <span class="rank">{{ store.currentEntries.length + n }}</span>
          <span class="placeholder">Empty — add a player from the table</span>
        </li>
      </ol>
    </div>
  </aside>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem;
}

.panel__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 0.5rem;
  background-color: rgb(18, 24, 32);
  border: 1px solid rgb(29, 36, 44);
  cursor: pointer;
  border-radius: 0.3rem;
}

.progress {
  width: 100%;
  height: 0.4rem;
  margin: 0.2rem 0;
  border-radius: 0.2rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: none;
  background: linear-gradient(90deg, rgb(42, 52, 63) 0%, rgb(34, 42, 51) 0px);
}

progress::-webkit-progress-bar {
  background-color: #e0e0e0; /* Track background color */
  border-radius: 10px;
}

progress::-webkit-progress-value {
  background-color: #4caf50; /* Filled bar color */
  border-radius: 10px;
}

/* 2. Mozilla (Firefox) */
progress::-moz-progress-bar {
  background-color: #4caf50; /* Filled bar color */
  border-radius: 10px;
}

</style>