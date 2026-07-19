import { useEffect, useState } from 'react'
import type { Game } from '../models'
import { createGame, subscribeGames } from '../repositories/gamesRepository'
import { deleteGame } from '../services/gameEngine'

export function useAdminGamesListViewModel() {
  const [games, setGames] = useState<Game[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => subscribeGames(setGames), [])

  async function addGame(name: string): Promise<string> {
    return createGame(name)
  }

  async function removeGame(gameId: string) {
    setError(null)
    try {
      await deleteGame(gameId)
    } catch {
      setError('Impossible de supprimer cette partie.')
    }
  }

  return { games, error, addGame, removeGame }
}
