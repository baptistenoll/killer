import { useState } from 'react'
import type { FormEvent } from 'react'
import { usePlayerAuth } from '../../viewmodels/PlayerAuthContext'

interface PlayerLoginPageProps {
  gameId: string
}

export function PlayerLoginPage({ gameId }: PlayerLoginPageProps) {
  const { loginWithPin, error, loading } = usePlayerAuth()
  const [pin, setPin] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await loginWithPin(gameId, pin)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-slate-900 p-6"
      >
        <h1 className="text-xl font-semibold text-slate-100">Rejoindre la partie</h1>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Code à 4 chiffres"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
          className="w-full rounded-md bg-slate-800 px-3 py-2 text-center text-2xl tracking-widest text-slate-100 outline-none focus:ring-2 focus:ring-red-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-red-600 px-3 py-2 font-medium text-white disabled:opacity-50"
        >
          Entrer
        </button>
      </form>
    </div>
  )
}
