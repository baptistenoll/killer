import { addDoc, collection, doc, onSnapshot } from 'firebase/firestore'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { Game, GameStatus } from '../models'

function gamesCollection() {
  return collection(db, 'games')
}

function toGame(snap: QueryDocumentSnapshot<DocumentData>): Game {
  const data = snap.data()
  return {
    id: snap.id,
    name: data.name,
    status: data.status,
    createdAt: data.createdAt,
  }
}

export async function createGame(name: string): Promise<string> {
  const ref = await addDoc(gamesCollection(), {
    name,
    status: 'setup' satisfies GameStatus,
    createdAt: Date.now(),
  })
  return ref.id
}

export function subscribeGame(
  gameId: string,
  callback: (game: Game | null) => void,
): () => void {
  return onSnapshot(doc(db, 'games', gameId), (snap) => {
    callback(snap.exists() ? toGame(snap as QueryDocumentSnapshot<DocumentData>) : null)
  })
}

export function subscribeGames(callback: (games: Game[]) => void): () => void {
  return onSnapshot(gamesCollection(), (snap) => {
    callback(snap.docs.map(toGame))
  })
}
