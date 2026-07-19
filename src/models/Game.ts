export type GameStatus = 'setup' | 'active' | 'ended'

export interface Game {
  id: string
  name: string
  status: GameStatus
  createdAt: number
}
