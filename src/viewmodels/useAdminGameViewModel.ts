import { useEffect, useMemo, useState } from 'react'
import type { Game, KillClaim, Mission, Player } from '../models'
import { subscribeGame } from '../repositories/gamesRepository'
import {
  createPlayer,
  generateAccessCode,
  setPlayerPhoto,
  setPlayerTarget,
  subscribePlayers,
} from '../repositories/playersRepository'
import { addMission as addMissionDoc, subscribeMissions } from '../repositories/missionsRepository'
import { subscribePendingClaims } from '../repositories/killClaimsRepository'
import {
  approveKillClaim,
  assignMissionToPlayer,
  deleteMission as deleteMissionDoc,
  endGame,
  rejectKillClaim,
  startGame,
  updateMissionText as updateMissionTextDoc,
} from '../services/gameEngine'
import { resizeImageToDataUrl } from '../services/imageResize'

export function useAdminGameViewModel(gameId: string) {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [pendingClaims, setPendingClaims] = useState<KillClaim[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => subscribeGame(gameId, setGame), [gameId])
  useEffect(() => subscribePlayers(gameId, setPlayers), [gameId])
  useEffect(() => subscribeMissions(gameId, setMissions), [gameId])
  useEffect(() => subscribePendingClaims(gameId, setPendingClaims), [gameId])

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])

  async function addPlayer(name: string) {
    const existingCodes = new Set(players.map((p) => p.accessCode))
    let code = generateAccessCode()
    while (existingCodes.has(code)) {
      code = generateAccessCode()
    }
    try {
      await createPlayer(gameId, name, code)
    } catch {
      setError("Impossible d'ajouter le joueur.")
    }
  }

  async function addMissionText(text: string) {
    try {
      await addMissionDoc(gameId, text)
    } catch {
      setError("Impossible d'ajouter la mission.")
    }
  }

  async function updateMissionText(missionId: string, text: string) {
    setError(null)
    try {
      await updateMissionTextDoc(gameId, missionId, text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de modifier cette mission.')
    }
  }

  async function deleteMission(missionId: string) {
    setError(null)
    try {
      await deleteMissionDoc(gameId, missionId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de supprimer cette mission.')
    }
  }

  async function assignMission(playerId: string, missionId: string | null) {
    setError(null)
    const player = players.find((p) => p.id === playerId)
    if (!player) return
    try {
      await assignMissionToPlayer(gameId, playerId, player.missionId, missionId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'attribuer cette mission.")
    }
  }

  async function assignTarget(playerId: string, targetId: string | null) {
    setError(null)
    try {
      await setPlayerTarget(gameId, playerId, targetId)
    } catch {
      setError("Impossible d'attribuer cette cible.")
    }
  }

  async function uploadPhoto(playerId: string, file: File) {
    setError(null)
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      await setPlayerPhoto(gameId, playerId, dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'envoyer cette photo.")
    }
  }

  async function handleStartGame() {
    setError(null)
    try {
      await startGame(gameId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de démarrer la partie.')
    }
  }

  async function handleEndGame() {
    setError(null)
    try {
      await endGame(gameId)
    } catch {
      setError('Impossible de terminer la partie.')
    }
  }

  async function approveClaim(claimId: string) {
    setError(null)
    try {
      await approveKillClaim(gameId, claimId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de valider ce kill.')
    }
  }

  async function rejectClaim(claimId: string) {
    setError(null)
    try {
      await rejectKillClaim(gameId, claimId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de rejeter ce kill.')
    }
  }

  return {
    game,
    players,
    playersById,
    missions,
    pendingClaims,
    error,
    addPlayer,
    addMissionText,
    updateMissionText,
    deleteMission,
    assignMission,
    assignTarget,
    uploadPhoto,
    startGame: handleStartGame,
    endGame: handleEndGame,
    approveClaim,
    rejectClaim,
  }
}
