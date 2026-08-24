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
    const totalRounds = ref(16)
    const slotsPerRound = ref(12)

    /** round number -> ordered list of players. Order IS the ranking. */
    const rounds = ref<Record<number, RankedPlayer[]>>({})
    /** playerIds the user has marked as gone in the real draft */
    const drafted = ref<number[]>([])
    const selectedRound = ref(1)

    const roundNumbers = computed(() =>
      Array.from({ length: totalRounds.value }, (_, i) => i + 1)
    )
    const totalSlots = computed(() => totalRounds.value * slotsPerRound.value)
    const filledCount = computed(() =>
      Object.values(rounds.value).reduce((n, list) => n + list.length, 0)
    )

    const entriesFor = (round: number) => rounds.value[round] ?? []
    const countFor = (round: number) => entriesFor(round).length
    const isRoundFull = (round: number) => countFor(round) >= slotsPerRound.value

    const currentEntries = computed(() => entriesFor(selectedRound.value))

    /** which rounds a player appears in — drives the R1 / R3 badges */
    const roundsByPlayer = computed(() => {
      const map = new Map<number, number[]>()
      for (const [round, list] of Object.entries(rounds.value)) {
        for (const p of list) {
          const arr = map.get(p.playerId) ?? []
          arr.push(Number(round))
          map.set(p.playerId, arr)
        }
      }
      for (const arr of map.values()) arr.sort((a, b) => a - b)
      return map
    })

    const roundsFor = (playerId: number) => roundsByPlayer.value.get(playerId) ?? []
    const isDrafted = (playerId: number) => drafted.value.includes(playerId)

    function writeRound(round: number, list: RankedPlayer[]) {
      rounds.value = { ...rounds.value, [round]: list }
    }

    /** Append to a round. Returns false if full or already present in THAT round. */
    function addToRound(player: RankedPlayer, round = selectedRound.value) {
      const list = entriesFor(round)
      if (list.length >= slotsPerRound.value) return false
      if (list.some((p) => p.playerId === player.playerId)) return false
      writeRound(round, [...list, { ...player }])
      return true
    }

    function removeFromRound(round: number, playerId: number) {
      writeRound(round, entriesFor(round).filter((p) => p.playerId !== playerId))
    }

    /** Reorder within a round. Indices are into the filled list. */
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

    function setRoundOrder(round: number, list: RankedPlayer[]) {
      writeRound(round, list)
    }

    function resetBoard() {
      rounds.value = {}
      drafted.value = []
      selectedRound.value = 1
    }

    return {
      totalRounds, slotsPerRound, rounds, drafted, selectedRound,
      roundNumbers, totalSlots, filledCount, currentEntries,
      entriesFor, countFor, isRoundFull, roundsFor, isDrafted,
      addToRound, removeFromRound, move, setNote, toggleDrafted, resetBoard, setRoundOrder,
    }
  },
  {
    persist: {
      key: 'nhl-draft',
      pick: ['totalRounds', 'slotsPerRound', 'rounds', 'drafted', 'selectedRound'],
    },
  }
)