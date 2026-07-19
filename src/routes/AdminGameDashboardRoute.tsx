import { Navigate, useParams } from 'react-router-dom'
import { AdminDashboardPage } from '../views/admin/AdminDashboardPage'

export function AdminGameDashboardRoute() {
  const { gameId } = useParams<{ gameId: string }>()
  if (!gameId) return <Navigate to="/admin" replace />
  return <AdminDashboardPage gameId={gameId} />
}
