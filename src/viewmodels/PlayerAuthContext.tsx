import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { auth } from '../services/firebase'
import { bindPlayerToUid, findPlayerByAccessCode, subscribePlayer } from '../repositories/playersRepository'
import type { Player } from '../models'
import {
  clearStoredPlayerSession,
  getStoredPlayerSession,
  setStoredPlayerSession,
} from '../services/playerSession'
import type { PlayerSession } from '../services/playerSession'

interface PlayerAuthState {
  player: Player | null
  loading: boolean
  error: string | null
  loginWithPin: (gameId: string, pin: string) => Promise<boolean>
  logout: () => void
}

const PlayerAuthContext = createContext<PlayerAuthState | null>(null)

export function PlayerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlayerSession | null>(() => getStoredPlayerSession())
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(!!session)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
      setPlayer(null)
      return
    }
    setLoading(true)
    return subscribePlayer(session.gameId, session.playerId, (p) => {
      setPlayer(p)
      setLoading(false)
    })
  }, [session])

  const loginWithPin = useCallback(async (gameId: string, pin: string): Promise<boolean> => {
    setError(null)
    setLoading(true)
    try {
      const found = await findPlayerByAccessCode(gameId, pin)
      if (!found) {
        setError('Code invalide.')
        setLoading(false)
        return false
      }
      const uid = auth.currentUser?.uid ?? (await signInAnonymously(auth)).user.uid
      if (found.boundUid && found.boundUid !== uid) {
        setError('Ce code est déjà utilisé sur un autre appareil.')
        setLoading(false)
        return false
      }
      if (!found.boundUid) {
        await bindPlayerToUid(gameId, found.id, uid)
      }
      const newSession = { gameId, playerId: found.id }
      setStoredPlayerSession(newSession)
      setSession(newSession)
      return true
    } catch {
      setError('Une erreur est survenue, réessaie.')
      setLoading(false)
      return false
    }
  }, [])

  const logout = useCallback(() => {
    clearStoredPlayerSession()
    setSession(null)
  }, [])

  return (
    <PlayerAuthContext.Provider value={{ player, loading, error, loginWithPin, logout }}>
      {children}
    </PlayerAuthContext.Provider>
  )
}

export function usePlayerAuth(): PlayerAuthState {
  const ctx = useContext(PlayerAuthContext)
  if (!ctx) throw new Error('usePlayerAuth must be used within PlayerAuthProvider')
  return ctx
}
