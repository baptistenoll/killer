import { useNavigate } from 'react-router-dom'
import { AdminGamesListPage } from '../views/admin/AdminGamesListPage'

export function AdminGamesListRoute() {
  const navigate = useNavigate()
  return <AdminGamesListPage onSelectGame={(gameId) => navigate(`/admin/games/${gameId}`)} />
}
