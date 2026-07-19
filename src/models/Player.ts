export type PlayerStatus = 'alive' | 'eliminated'

export interface Player {
  id: string
  gameId: string
  name: string
  accessCode: string
  status: PlayerStatus
  score: number
  photoUrl: string | null
  /** id of the Player this player is currently hunting, null once no target remains */
  targetId: string | null
  /** id of the pool Mission this text was assigned from; null once inherited from a kill or cleared */
  missionId: string | null
  /** mission currently assigned against targetId */
  missionText: string | null
  /** anonymous auth uid bound to this player on first PIN login */
  boundUid: string | null
}
