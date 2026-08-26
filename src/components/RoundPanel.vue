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
            <span class="rank">{{ i + 1 }}</span>
            <div class="round__wrapper">
              <div class="line">
                <div class="info">
                  <strong :title="`Drag to reorder ${p.name}`" class="handle">{{ p.name }}</strong>
                  <span :class="[`pos-${p.position.toLowerCase()} handle`]" :title="`Drag to reorder ${p.name}`">{{ p.position == 'L' || p.position == 'R' ? p.position + 'W' : p.position }}</span>
                  <span class="team handle" :title="`Drag to reorder ${p.name}`">{{ p.team }}</span>
                  <span v-if="p.points != null" class="stat handle" :title="`Drag to reorder ${p.name}`">
                    {{ p.points }} PTS · {{ p.goals }}G {{ p.assists }}A
                  </span>
                </div>
              </div>
              <input
                class="note"
                :value="p.note ?? ''"
                placeholder="Add a note"
                @input="store.setNote(store.selectedRound, p.playerId, ($event.target as HTMLInputElement).value)"
              />
            </div>
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
  transition: all 0.2s ease-in-out;
  color: rgb(124, 137, 152);
}

.panel__tab.active {
  color: rgb(230, 237, 243);
  background-color: rgba(154, 230, 180, 0.1);
  border-color: rgb(98, 255, 84);
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

.head {
  display: flex;
  gap: 0.6rem;
  padding: 0.5rem;
  border-bottom: 1px solid rgb(29, 36, 44);
  align-items: baseline;
}

.head h2 {
  font-size: 1.5rem;
  text-transform: uppercase;
  font-weight: 600;
}

.head span {
  font-size: 0.8rem;
  color: rgb(138, 151, 166);
}

.hint {
  margin-left: auto;
}

.slots {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  overflow-y: auto;
  max-height: calc(100vh - 20rem);
}

.slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem;
  background-color: rgb(20, 26, 34);
  border: 1px solid rgb(32, 41, 50);
  border-radius: 0.3rem;
  box-sizing: border-box;
}

.body {
  display: flex;
  gap: 0.9rem;
  align-items: center;
}

.round__wrapper {
  display: flex;
  flex-direction: column;
}

.line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filled-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start !important;
  width: 100%;
}

.info {
  display: flex;
  gap: 0.4rem;
}

.note {
  background-color: transparent;
  color: rgb(138, 151, 166);
  border: none;
  border-bottom: dashed 1px rgb(36, 46, 56);
  margin-top: 0.4rem;
}

.note::placeholder {
  color: rgb(138, 151, 166);
}

.empty {
  display: flex;
  gap: 0.9rem;
  width: 100%;
  box-sizing: border-box;
}

.slot.empty {
  justify-content: flex-start;
}

.info strong {
  font-weight: 600;
  color: rgb(230, 237, 243);
}

.info .handle {
  font-size: 0.9rem;
  cursor: grab;
}

.info .handle:nth-child(3), .info .handle:nth-child(4) {
  color: rgb(138, 151, 166);
  font-size: 0.8rem;
  align-self: center;
}

.info .handle:nth-child(4) {
  color: rgb(95, 108, 123);
}

.pos-c {
  color: rgb(127, 209, 232); 
}

.pos-l, .pos-r {
  color: rgb(154, 230, 180); 
}

.pos-d {
  color: rgb(196, 166, 240);
}

.pos-g {
  color: rgb(242, 169, 59);
}

</style>