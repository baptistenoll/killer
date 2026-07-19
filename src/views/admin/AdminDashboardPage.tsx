import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAdminGameViewModel } from '../../viewmodels/useAdminGameViewModel'
import type { GameStatus, KillClaim, Mission, Player } from '../../models'

interface AdminDashboardPageProps {
  gameId: string
}

export function AdminDashboardPage({ gameId }: AdminDashboardPageProps) {
  const {
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
    startGame,
    endGame,
    approveClaim,
    rejectClaim,
  } = useAdminGameViewModel(gameId)

  if (!game) {
    return <div className="min-h-screen bg-slate-950 p-8 text-slate-400">Chargement…</div>
  }

  return (
    <div className="min-h-screen space-y-8 bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link to="/admin" className="text-sm text-slate-400 hover:text-slate-200">
          ← Retour aux parties
        </Link>
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{game.name}</h1>
            <p className="text-sm uppercase text-slate-400">{game.status}</p>
          </div>
          <div className="flex gap-2">
            {game.status === 'setup' && (
              <button
                type="button"
                onClick={startGame}
                className="rounded-md bg-red-600 px-4 py-2 font-medium"
              >
                Démarrer la partie
              </button>
            )}
            {game.status !== 'ended' && (
              <button
                type="button"
                onClick={endGame}
                className="rounded-md bg-slate-700 px-4 py-2 font-medium"
              >
                Terminer la partie
              </button>
            )}
          </div>
        </header>

        {error && <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>}

        <PendingClaimsSection
          claims={pendingClaims}
          playersById={playersById}
          onApprove={approveClaim}
          onReject={rejectClaim}
        />

        <PlayersSection
          players={players}
          playersById={playersById}
          missions={missions}
          gameStatus={game.status}
          onAddPlayer={addPlayer}
          onAssignMission={assignMission}
          onAssignTarget={assignTarget}
          onUploadPhoto={uploadPhoto}
        />

        <MissionsSection
          missions={missions}
          playersById={playersById}
          onAddMission={addMissionText}
          onUpdateMission={updateMissionText}
          onDeleteMission={deleteMission}
        />
      </div>
    </div>
  )
}

function PendingClaimsSection({
  claims,
  playersById,
  onApprove,
  onReject,
}: {
  claims: KillClaim[]
  playersById: Map<string, Player>
  onApprove: (claimId: string) => void
  onReject: (claimId: string) => void
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Kills à valider ({claims.length})</h2>
      {claims.length === 0 && <p className="text-sm text-slate-400">Rien en attente.</p>}
      <ul className="space-y-2">
        {claims.map((claim) => (
          <li
            key={claim.id}
            className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3"
          >
            <div>
              <p>
                <span className="font-medium">{playersById.get(claim.killerId)?.name}</span>
                {' a tué '}
                <span className="font-medium">{playersById.get(claim.victimId)?.name}</span>
              </p>
              <p className="text-sm text-slate-400">Mission : {claim.missionText}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onApprove(claim.id)}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium"
              >
                Valider
              </button>
              <button
                type="button"
                onClick={() => onReject(claim.id)}
                className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium"
              >
                Rejeter
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PlayersSection({
  players,
  playersById,
  missions,
  gameStatus,
  onAddPlayer,
  onAssignMission,
  onAssignTarget,
  onUploadPhoto,
}: {
  players: Player[]
  playersById: Map<string, Player>
  missions: Mission[]
  gameStatus: GameStatus
  onAddPlayer: (name: string) => void
  onAssignMission: (playerId: string, missionId: string | null) => void
  onAssignTarget: (playerId: string, targetId: string | null) => void
  onUploadPhoto: (playerId: string, file: File) => void
}) {
  const [name, setName] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAddPlayer(name.trim())
    setName('')
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Joueurs ({players.length})</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du joueur"
          className="flex-1 rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
        />
        <button type="submit" className="rounded-md bg-red-600 px-4 py-2 font-medium">
          Ajouter
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-2">Photo</th>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Cible</th>
              <th className="px-4 py-2">Mission</th>
              <th className="px-4 py-2">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {players.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    {p.photoUrl ? (
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-500">
                        ?
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onUploadPhoto(p.id, file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </td>
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 font-mono">{p.accessCode}</td>
                <td className="px-4 py-2">{p.status === 'alive' ? 'Vivant' : 'Éliminé'}</td>
                <td className="px-4 py-2">
                  {gameStatus === 'setup' ? (
                    <select
                      value={p.targetId ?? ''}
                      onChange={(e) => onAssignTarget(p.id, e.target.value || null)}
                      className="rounded-md bg-slate-800 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">— aucune —</option>
                      {players
                        .filter(
                          (candidate) =>
                            candidate.id !== p.id &&
                            (candidate.id === p.targetId ||
                              !players.some((other) => other.targetId === candidate.id)),
                        )
                        .map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    (p.targetId ? playersById.get(p.targetId)?.name : '—')
                  )}
                </td>
                <td className="px-4 py-2">
                  {gameStatus === 'setup' ? (
                    <select
                      value={p.missionId ?? ''}
                      onChange={(e) => onAssignMission(p.id, e.target.value || null)}
                      className="rounded-md bg-slate-800 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">— aucune —</option>
                      {missions
                        .filter((m) => !m.used || m.assignedTo === p.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.text}
                          </option>
                        ))}
                    </select>
                  ) : (
                    (p.missionText ?? '—')
                  )}
                </td>
                <td className="px-4 py-2">{p.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MissionsSection({
  missions,
  playersById,
  onAddMission,
  onUpdateMission,
  onDeleteMission,
}: {
  missions: Mission[]
  playersById: Map<string, Player>
  onAddMission: (text: string) => void
  onUpdateMission: (missionId: string, text: string) => void
  onDeleteMission: (missionId: string) => void
}) {
  const [text, setText] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    onAddMission(text.trim())
    setText('')
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Missions ({missions.length})</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Texte de la mission"
          className="flex-1 rounded-md bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
        />
        <button type="submit" className="rounded-md bg-red-600 px-4 py-2 font-medium">
          Ajouter
        </button>
      </form>
      <ul className="space-y-2">
        {missions.map((m) => (
          <MissionRow
            key={m.id}
            mission={m}
            assigneeName={m.assignedTo ? playersById.get(m.assignedTo)?.name : undefined}
            onUpdate={onUpdateMission}
            onDelete={onDeleteMission}
          />
        ))}
        {missions.length === 0 && <p className="text-sm text-slate-400">Aucune mission.</p>}
      </ul>
    </section>
  )
}

function MissionRow({
  mission,
  assigneeName,
  onUpdate,
  onDelete,
}: {
  mission: Mission
  assigneeName: string | undefined
  onUpdate: (missionId: string, text: string) => void
  onDelete: (missionId: string) => void
}) {
  const [text, setText] = useState(mission.text)
  const dirty = text.trim() !== mission.text && text.trim().length > 0

  return (
    <li className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 rounded-md bg-slate-800 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-red-500"
      />
      <span className="whitespace-nowrap text-xs text-slate-400">
        {assigneeName ? `→ ${assigneeName}` : 'Disponible'}
      </span>
      <button
        type="button"
        disabled={!dirty}
        onClick={() => onUpdate(mission.id, text.trim())}
        className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
      >
        Enregistrer
      </button>
      <button
        type="button"
        onClick={() => onDelete(mission.id)}
        className="rounded-md bg-red-900 px-3 py-1.5 text-sm font-medium text-red-200"
      >
        Supprimer
      </button>
    </li>
  )
}
