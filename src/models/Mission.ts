export interface Mission {
  id: string
  gameId: string
  text: string
  /** true once assigned to a player, so it isn't handed out twice */
  used: boolean
  /** player currently holding this mission, null while unassigned */
  assignedTo: string | null
}
