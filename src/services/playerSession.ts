const STORAGE_KEY = 'killer.playerSession'

export interface PlayerSession {
  gameId: string
  playerId: string
}

export function getStoredPlayerSession(): PlayerSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PlayerSession
  } catch {
    return null
  }
}

export function setStoredPlayerSession(session: PlayerSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredPlayerSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
