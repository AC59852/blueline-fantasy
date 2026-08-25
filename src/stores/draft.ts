import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface RankedPlayer {
  playerId: number
  name: string
  team: string
  position: string
  points?: number
  goals?: number
  assists?: number
  note?: string
}

export const useDraftStore = defineStore(
  'draft',
  () => {
    /* ---------------------------------------------------------------- state */

    const totalRounds = ref(16)
    const slotsPerRound = ref(12)

    /** round number -> ordered list of players. Array order IS the ranking. */
    const rounds = ref<Record<number, RankedPlayer[]>>({})

    /** playerIds the user has marked as gone in the real draft. */
    const drafted = ref<number[]>([])

    /** Which round tab is active — new picks land here. */
    const selectedRound = ref(1)

    /** When on, drafted players are hidden from the table AND every round. */
    const hideDrafted = ref(false)

    /* ------------------------------------------------------------- getters */

    const roundNumbers = computed(() =>
      Array.from({ length: totalRounds.value }, (_, i) => i + 1)
    )

    const totalSlots = computed(() => totalRounds.value * slotsPerRound.value)

    const isDrafted = (playerId: number) => drafted.value.includes(playerId)

    /** Raw contents of a round, ignoring the filter. Source of truth for writes. */
    const entriesFor = (round: number): RankedPlayer[] => rounds.value[round] ?? []

    /** What the UI should render for a round, respecting hideDrafted. */
    const visibleEntriesFor = (round: number): RankedPlayer[] =>
      hideDrafted.value
        ? entriesFor(round).filter((p) => !isDrafted(p.playerId))
        : entriesFor(round)

    const currentEntries = computed(() => visibleEntriesFor(selectedRound.value))

    /** Visible count — what the round tabs and "N of 12 ranked" display. */
    const countFor = (round: number) => visibleEntriesFor(round).length

    /**
     * Fullness is measured against RAW entries on purpose. Counting visible
     * entries would let you overfill a round while drafted players are hidden.
     */
    const isRoundFull = (round: number) =>
      entriesFor(round).length >= slotsPerRound.value

    const filledCount = computed(() =>
      roundNumbers.value.reduce((n, r) => n + countFor(r), 0)
    )

    /** playerId -> rounds they appear in. Drives the R1 / R3 badges. */
    const roundsByPlayer = computed(() => {
      const map = new Map<number, number[]>()
      for (const r of roundNumbers.value) {
        for (const p of visibleEntriesFor(r)) {
          const arr = map.get(p.playerId) ?? []
          arr.push(r)
          map.set(p.playerId, arr)
        }
      }
      return map
    })

    const roundsFor = (playerId: number): number[] =>
      roundsByPlayer.value.get(playerId) ?? []

    /* ------------------------------------------------------------- actions */

    /** Every write funnels through here so the persist watcher always fires. */
    function writeRound(round: number, list: RankedPlayer[]) {
      rounds.value = { ...rounds.value, [round]: list }
    }

    /**
     * Append a player to a round. A player may appear in several rounds, but
     * only once within a given round. Returns false if the add was rejected.
     */
    function addToRound(player: RankedPlayer, round = selectedRound.value) {
      const list = entriesFor(round)
      if (list.length >= slotsPerRound.value) return false
      if (list.some((p) => p.playerId === player.playerId)) return false
      writeRound(round, [...list, { ...player }])
      return true
    }

    function removeFromRound(round: number, playerId: number) {
      writeRound(
        round,
        entriesFor(round).filter((p) => p.playerId !== playerId)
      )
    }

    /**
     * Accepts the reordered list from vue-draggable-plus. When the filter is
     * on, Sortable only saw the visible subset, so hidden players are merged
     * back in rather than dropped.
     */
    function setRoundOrder(round: number, visible: RankedPlayer[]) {
      if (!hideDrafted.value) {
        writeRound(round, visible)
        return
      }
      const hidden = entriesFor(round).filter((p) => isDrafted(p.playerId))
      writeRound(round, [...visible, ...hidden])
    }

    /** Index-based reorder, for keyboard controls. Operates on raw entries. */
    function move(round: number, from: number, to: number) {
      const list = [...entriesFor(round)]
      if (from < 0 || from >= list.length) return
      const target = Math.max(0, Math.min(to, list.length - 1))
      if (from === target) return

      const moved = list.splice(from, 1)[0]
      if (!moved) return

      list.splice(target, 0, moved)
      writeRound(round, list)
    }

    function setNote(round: number, playerId: number, note: string) {
      writeRound(
        round,
        entriesFor(round).map((p) => (p.playerId === playerId ? { ...p, note } : p))
      )
    }

    function toggleDrafted(playerId: number) {
      drafted.value = isDrafted(playerId)
        ? drafted.value.filter((id) => id !== playerId)
        : [...drafted.value, playerId]
    }

    function toggleHideDrafted() {
      hideDrafted.value = !hideDrafted.value
    }

    /** Destructive: permanently strip drafted players from every round. */
    function purgeDrafted() {
      const next: Record<number, RankedPlayer[]> = {}
      for (const [round, list] of Object.entries(rounds.value)) {
        next[Number(round)] = list.filter((p) => !isDrafted(p.playerId))
      }
      rounds.value = next
    }

    function selectRound(round: number) {
      if (round >= 1 && round <= totalRounds.value) selectedRound.value = round
    }

    /** Resize the board, dropping any rounds that no longer exist. */
    function resize(nextRounds: number, nextSlotsPerRound: number) {
      totalRounds.value = nextRounds
      slotsPerRound.value = nextSlotsPerRound

      const next: Record<number, RankedPlayer[]> = {}
      for (const [round, list] of Object.entries(rounds.value)) {
        const r = Number(round)
        if (r <= nextRounds) next[r] = list.slice(0, nextSlotsPerRound)
      }
      rounds.value = next

      if (selectedRound.value > nextRounds) selectedRound.value = nextRounds
    }

    function resetBoard() {
      rounds.value = {}
      drafted.value = []
      selectedRound.value = 1
      hideDrafted.value = false
    }

    return {
      // state
      totalRounds,
      slotsPerRound,
      rounds,
      drafted,
      selectedRound,
      hideDrafted,
      // getters
      roundNumbers,
      totalSlots,
      currentEntries,
      filledCount,
      entriesFor,
      visibleEntriesFor,
      countFor,
      isRoundFull,
      isDrafted,
      roundsFor,
      // actions
      addToRound,
      removeFromRound,
      setRoundOrder,
      move,
      setNote,
      toggleDrafted,
      toggleHideDrafted,
      purgeDrafted,
      selectRound,
      resize,
      resetBoard,
    }
  },
  {
    persist: {
      key: 'nhl-draft-v2',
      pick: [
        'totalRounds',
        'slotsPerRound',
        'rounds',
        'drafted',
        'selectedRound',
        'hideDrafted',
      ],
    },
  }
)