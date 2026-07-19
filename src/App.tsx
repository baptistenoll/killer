import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './viewmodels/AdminAuthContext'
import { PlayerAuthProvider } from './viewmodels/PlayerAuthContext'
import { AdminLoginPage } from './views/admin/AdminLoginPage'
import { AdminRoute } from './routes/AdminRoute'
import { AdminGamesListRoute } from './routes/AdminGamesListRoute'
import { AdminGameDashboardRoute } from './routes/AdminGameDashboardRoute'
import { PlayerGameRoute } from './routes/PlayerGameRoute'
import { isFirebaseConfigured } from './services/firebase'

function App() {
  return (
    <AdminAuthProvider>
      <PlayerAuthProvider>
        <BrowserRouter>
          {!isFirebaseConfigured && (
            <div className="bg-amber-600 px-4 py-2 text-center text-sm font-medium text-slate-950">
              Firebase n'est pas encore configuré — renseigne les variables dans .env
            </div>
          )}
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminGamesListRoute />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/games/:gameId"
              element={
                <AdminRoute>
                  <AdminGameDashboardRoute />
                </AdminRoute>
              }
            />
            <Route path="/play/:gameId" element={<PlayerGameRoute />} />
          </Routes>
        </BrowserRouter>
      </PlayerAuthProvider>
    </AdminAuthProvider>
  )
}

export default App
