import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAdminGamesListViewModel } from '../../viewmodels/useAdminGamesListViewModel'

interface AdminGamesListPageProps {
  onSelectGame: (gameId: string) => void
}

export function AdminGamesListPage({ onSelectGame }: AdminGamesListPageProps) {
  const { games, error, addGame, removeGame } = useAdminGamesListViewModel()
  const [name, setName] = useState('')

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const id = await addGame(name.trim())
    setName('')
    onSelectGame(id)
  }

  function handleDelete(gameId: string, gameName: string) {
    if (window.confirm(`Supprimer définitivement la partie "${gameName}" ?`)) {
      removeGame(gameId)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-2xl font-semibold">Parties</h1>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de la partie"
            className="flex-1 rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
          />
          <button type="submit" className="rounded-md bg-red-600 px-4 py-2 font-medium">
            Créer
          </button>
        </form>
        {error && <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>}
        <ul className="divide-y divide-slate-800 rounded-lg bg-slate-900">
          {games.map((g) => (
            <li key={g.id} className="flex items-center">
              <button
                type="button"
                onClick={() => onSelectGame(g.id)}
                className="flex flex-1 items-center justify-between px-4 py-3 text-left hover:bg-slate-800"
              >
                <span>{g.name}</span>
                <span className="text-xs uppercase text-slate-400">{g.status}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(g.id, g.name)}
                className="px-3 py-3 text-sm font-medium text-red-400 hover:text-red-300"
              >
                Supprimer
              </button>
            </li>
          ))}
          {games.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400">Aucune partie pour l'instant.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
