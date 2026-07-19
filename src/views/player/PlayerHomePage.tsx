import { usePlayerAuth } from '../../viewmodels/PlayerAuthContext'
import { usePlayerGameViewModel } from '../../viewmodels/usePlayerGameViewModel'

interface PlayerHomePageProps {
  gameId: string
}

export function PlayerHomePage({ gameId }: PlayerHomePageProps) {
  const { player, logout } = usePlayerAuth()
  const { target, pendingClaim, error, submitKill } = usePlayerGameViewModel(gameId, player)

  if (!player) {
    return <div className="min-h-screen bg-slate-950 p-8 text-slate-400">Chargement…</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-sm space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{player.name}</h1>
          <button type="button" onClick={logout} className="text-sm text-slate-400">
            Se déconnecter
          </button>
        </header>

        <div className="rounded-lg bg-slate-900 p-4 text-center">
          <p className="text-sm text-slate-400">Score</p>
          <p className="text-3xl font-bold">{player.score}</p>
        </div>

        {player.status === 'eliminated' ? (
          <div className="rounded-lg bg-slate-900 p-4 text-center text-slate-300">
            Tu as été éliminé. Merci d'avoir joué !
          </div>
        ) : target ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg bg-slate-900 p-4">
              {target.photoUrl && (
                <img
                  src={target.photoUrl}
                  alt={target.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-sm text-slate-400">Ta cible</p>
                <p className="text-lg font-medium">{target.name}</p>
              </div>
            </div>
            <div className="rounded-lg bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Ta mission</p>
              <p className="text-lg font-medium">{player.missionText}</p>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {pendingClaim ? (
              <p className="rounded-md bg-amber-950 px-3 py-2 text-center text-sm text-amber-300">
                En attente de validation par l'admin…
              </p>
            ) : (
              <button
                type="button"
                onClick={submitKill}
                className="w-full rounded-md bg-red-600 px-3 py-2 font-medium"
              >
                J'ai tué ma cible
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-slate-900 p-4 text-center text-slate-300">
            La partie n'a pas encore commencé, ou tu as gagné !
          </div>
        )}
      </div>
    </div>
  )
}
