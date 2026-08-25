<script setup lang="ts">
import SkaterTable from '@/components/SkaterTable.vue'
import RoundPanel from '@/components/RoundPanel.vue'
import { useDraftStore } from '@/stores/draft'

const draft = useDraftStore()

function confirmReset() {
  if (draft.filledCount === 0 || window.confirm('Clear every round and start over?')) {
    draft.resetBoard()
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="title">
        <h1>Draft Board</h1>
        <span class="sub">Pick order planner</span>
      </div>

      <div class="meta">
        <span><strong>{{ draft.filledCount }}</strong> of {{ draft.totalSlots }} slots set</span>
        <span><strong>{{ draft.drafted.length }}</strong> marked drafted</span>
        <button type="button" @click="confirmReset">Reset board</button>
      </div>
    </header>

    <main class="main">
      <SkaterTable class="skaterTable"/>
      <RoundPanel class="panel" />
    </main>
  </div>
</template>

<style scoped>
.main {
  display: flex;
  max-width: 97%;
  margin: 0 auto;
  gap: 3rem;
}

.skaterTable {
  flex: 1 1 auto;
  width: 80%;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.title {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.meta {
  display: flex;
  gap: 0.5rem;
}

.meta span::after {
  content: '|';
  margin: 0 0.5rem;
}
</style>