import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../../viewmodels/AdminAuthContext'

export function AdminLoginPage() {
  const { user, isAdmin, loading, signIn } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
    } catch {
      setError('Identifiants invalides.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-slate-900 p-6"
      >
        <h1 className="text-xl font-semibold text-slate-100">Connexion admin</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-red-500"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-md bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-red-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && user && !isAdmin && (
          <p className="text-sm text-red-400">
            Ce compte est bien connecté mais n'a pas les droits admin.
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-red-600 px-3 py-2 font-medium text-white disabled:opacity-50"
        >
          Se connecter
        </button>
      </form>
    </div>
  )
}
