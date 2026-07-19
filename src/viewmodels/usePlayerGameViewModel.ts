import { useEffect, useState } from 'react'
import type { KillClaim, Player } from '../models'
import { subscribePlayer } from '../repositories/playersRepository'
import { submitKillClaim, subscribeOwnPendingClaim } from '../repositories/killClaimsRepository'

export function usePlayerGameViewModel(gameId: string, player: Player | null) {
  const [target, setTarget] = useState<Player | null>(null)
  const [pendingClaim, setPendingClaim] = useState<KillClaim | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!player?.targetId) {
      setTarget(null)
      return
    }
    return subscribePlayer(gameId, player.targetId, setTarget)
  }, [gameId, player?.targetId])

  useEffect(() => {
    if (!player) return
    return subscribeOwnPendingClaim(gameId, player.id, setPendingClaim)
  }, [gameId, player?.id])

  async function submitKill() {
    if (!player?.targetId || !player.missionText) return
    setError(null)
    try {
      await submitKillClaim(gameId, player.id, player.targetId, player.missionText)
    } catch {
      setError("Impossible d'envoyer la validation, réessaie.")
    }
  }

  return { target, pendingClaim, error, submitKill }
}
