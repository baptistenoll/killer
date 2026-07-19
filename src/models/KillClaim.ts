export type KillClaimStatus = 'pending' | 'approved' | 'rejected'

export interface KillClaim {
  id: string
  gameId: string
  killerId: string
  victimId: string
  missionText: string
  status: KillClaimStatus
  submittedAt: number
  reviewedAt: number | null
}
