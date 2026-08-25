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
      <RoundPanel class="roundPanel" />
    </main>
  </div>
</template>

<style>
html, body, div, span, applet, object, iframe,
h1, h2, h3, h4, h5, h6, p, blockquote, pre,
a, abbr, acronym, address, big, cite, code,
del, dfn, em, img, ins, kbd, q, s, samp,
small, strike, strong, sub, sup, tt, var,
b, u, i, center,
dl, dt, dd, ol, ul, li,
fieldset, form, label, legend,
table, caption, tbody, tfoot, thead, tr, th, td,
article, aside, canvas, details, embed, 
figure, figcaption, footer, header, hgroup, 
menu, nav, output, ruby, section, summary,
time, mark, audio, video {
	margin: 0;
	padding: 0;
	border: 0;
	font-size: 100%;
	font: inherit;
	vertical-align: baseline;
}
/* HTML5 display-role reset for older browsers */
article, aside, details, figcaption, figure, 
footer, header, hgroup, menu, nav, section {
	display: block;
}
body {
	line-height: 1;
}
ol, ul {
	list-style: none;
}
blockquote, q {
	quotes: none;
}
blockquote:before, blockquote:after,
q:before, q:after {
	content: '';
	content: none;
}

table {
	border-collapse: separate;
	border-spacing: 0 0.6rem;
  padding-right: 1rem;
}

.app {
  height: 100vh;
  overflow: hidden;
  background-color: rgb(11, 14, 18);
  color: white;
}

.app-header {
  background-color: rgb(14, 18, 24);
}

.main {
  display: flex;
  margin: 0 auto;
  gap: 1rem;
  width: 98%;
}

.skaterTable {
  flex: 1 0 auto;
  width: 75%;
}

.roundPanel {
  flex: 0 0 25%;
  max-width: 25%;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  padding: 2rem 1rem;
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