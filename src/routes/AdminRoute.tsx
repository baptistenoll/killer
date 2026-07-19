import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../viewmodels/AdminAuthContext'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAdminAuth()

  if (loading) {
    return <div className="min-h-screen bg-slate-950 p-8 text-slate-400">Chargement…</div>
  }
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }
  return <>{children}</>
}
