import { addDoc, collection, onSnapshot } from 'firebase/firestore'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { Mission } from '../models'

function missionsCollection(gameId: string) {
  return collection(db, 'games', gameId, 'missions')
}

function toMission(snap: QueryDocumentSnapshot<DocumentData>): Mission {
  const data = snap.data()
  return {
    id: snap.id,
    gameId: data.gameId,
    text: data.text,
    used: data.used,
    assignedTo: data.assignedTo,
  }
}

export async function addMission(gameId: string, text: string): Promise<string> {
  const ref = await addDoc(missionsCollection(gameId), {
    gameId,
    text,
    used: false,
    assignedTo: null,
  })
  return ref.id
}

export function subscribeMissions(
  gameId: string,
  callback: (missions: Mission[]) => void,
): () => void {
  return onSnapshot(missionsCollection(gameId), (snap) => {
    callback(snap.docs.map(toMission))
  })
}
