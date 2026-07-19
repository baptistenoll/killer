import { Navigate, useParams } from 'react-router-dom'
import { usePlayerAuth } from '../viewmodels/PlayerAuthContext'
import { PlayerLoginPage } from '../views/player/PlayerLoginPage'
import { PlayerHomePage } from '../views/player/PlayerHomePage'

export function PlayerGameRoute() {
  const { gameId } = useParams<{ gameId: string }>()
  const { player, loading } = usePlayerAuth()

  if (!gameId) return <Navigate to="/" replace />
  if (loading) {
    return <div className="min-h-screen bg-slate-950 p-8 text-slate-400">Chargement…</div>
  }
  if (!player || player.gameId !== gameId) {
    return <PlayerLoginPage gameId={gameId} />
  }
  return <PlayerHomePage gameId={gameId} />
}
