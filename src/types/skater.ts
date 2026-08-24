export interface DraftedPlayer {
  playerId: number
  name: string
  position: string
  team: string
  goals: number
  assists: number
  points: number
  plusMinus: number
  shots: number
  ppPoints: number
}

export function toDraftedPlayer(row: any): DraftedPlayer {
  return {
    playerId: row.playerId,
    name: row.skaterFullName,
    position: row.positionCode,
    team: String(row.teamAbbrevs).split(',').pop()!.trim(),
    goals: row.goals ?? 0,
    assists: row.assists ?? 0,
    points: row.points ?? 0,
    plusMinus: row.plusMinus ?? 0,
    shots: row.shots ?? 0,
    ppPoints: row.ppPoints ?? 0,
  }
}