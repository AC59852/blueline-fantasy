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
  background-color: rgb(11, 14, 18);
  font-family: "IBM Plex Sans";
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
	border-spacing: 0 0.8rem;
  padding-right: 1rem;
}

tbody tr:first-child td {
  border-top: 20px solid transparent;
}

.app {
  color: white;
}

.main {
  display: flex;
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
  padding: 1rem 1rem;
  background-color: rgb(14, 18, 24);
}

.title {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
}

.title h1 {
  font-size: 1.5rem;
  text-transform: uppercase;
  font-weight: 600;
  color: rgb(230, 237, 243);
}

.sub {
  font-size: 0.8rem;
  color: rgb(110, 124, 140);
  text-transform: uppercase;
}

.meta {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}

.meta span:nth-child(1)::after {
  content: '|';
  margin: 0 0.5rem;
}

.meta button {
  border: 1px solid rgb(36, 46, 56);
  border-radius: 0.2rem;
  background-color: transparent;
  padding: 0.4rem 0.6rem;
  color: rgb(110, 124, 140);
  cursor: pointer;
  margin-left: 1rem;
  transition: all 0.2s ease-in-out;
}

.meta button:hover {
  background-color: rgb(27, 36, 46);
  color: rgb(230, 237, 243);
  border: 1px solid rgb(62, 76, 90);
}

.meta span {
  color: rgb(138, 151, 166);
}

.meta strong {
  color: rgb(230, 237, 243);
}

</style>